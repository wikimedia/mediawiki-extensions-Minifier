/**
 * JavaScript minification server
 * API:
 *  GET / - returns statistics
 *  POST / - returns minified JS. Parameters:
 *  - text - JS to minify
 *  - id - cache ID for this JS chunk [optional]
 */

var http = require( 'http' );
var cluster = require( 'cluster' );
var os = require( 'os' );
var url = require( 'url' );
var queryString = require( 'querystring' );
var lru = require( 'lru-cache' );
var crypto = require( 'crypto' );

var config = require( './config' );
var statsUI = require( './stats' );
var utils = require( './utils' );
var Work = require( './work' );

config.load( 'main', 'settings.json' );

/**
 * Server statistics
 * @type Object
 */
var stats = {
	// Number of requests received
	requests: 0,

	// Number of minification requests that received an error response
	requestErrors: 0,
	requestsResponded: 0,
	requestTimeouts: 0,
	//disconnects: 0,
	minificationTime: 0,
	workerErrors: 0,
	cacheHits: 0,
	cacheMisses: 0,
	queueHits: 0,
	queueMisses: 0,
	queueLength: 0
};

setupCluster();

var cache = lru( {
	max: config.main.queue.sizeInMB * 1024 * 1024,
	length: function( s ) { return s.length; }
} );
var queue = [];

http.createServer(
	function ( request, response ) {
		log( request.method + ' ' + request.url + ' from ' + request.connection.remoteAddress );
		var parsedUrl = url.parse( request.url );
		if ( parsedUrl.pathname === '/' ) {
			if ( request.method === 'GET' ) {
				outputStats( request, response );
			} else if ( request.method === 'POST' ) {
				getBody( request, response );
			} else {
				reportError( response, 405, 'Method Not Allowed' );
			}
		} else {
			reportError( response, 404, 'Not Found' );
		}
	}
).listen( config.main.network.port );

function outputStats( request, response ) {
	stats.queueLength = queue.length;
	var res = statsUI.render( stats, 'html' );
	response.writeHead( 200, { 'Content-Type': res.type } );
	response.write( res.output );
	response.end();
}

function reportError( response, code, name, message ) {
	response.writeHead( code, { 'Content-Type': 'text/html' } );
	response.write( utils.errorPage( code, name, message ) );
	response.end();
}

function getBody( request, response ) {
	var post = '';
	request.on( 'data', function( data ) {
		post += data;
	} );
	request.on( 'end', function() {
		request.post = queryString.parse( post );
		minify( request, response );
	} );
}

function minify( request, response ) {
	stats.requests++;
	var text = request.post.text;
	var id = request.post.id;
	if ( typeof id === 'undefined' ) {
		id = md5( text );
	}
	var cached = cache.get( id );
	if ( typeof cached !== 'undefined' ) {
		stats.cacheHits++;
		log('cache hit');
		sendMinified( response, cached );
	} else {
		var pending = new PendingRequest( response )
		// @todo: Non-linear search?
		if ( !sendToFreeWorker( id, text, pending ) ) {
			enqueue( id, text, pending )
			var work = new Work( id, text, pending );
		}
	}
}

function sendToFreeWorker( id, text, pending ) {
	for ( var workerId in cluster.workers ) {
		var worker = cluster.workers[workerId];
		if ( typeof worker.currentWork === 'undefined' ) {
			worker.currentWork = new Work( id, text, pending );
			worker.currentWork.sendToWorker( worker );
			log( 'Sending work ' + id + ' to worker #' + workerId );
			return true;
		}
	}
	return false;
}

function enqueue( id, text, request ) {
	for ( var i = 0; i < queue.length; i++ ) {
		if ( queue[i].id == id ) {
			queue[i].requests.push( request );
			return;
		}
	}
	queue.push( new Work( id, text, request ) );
}

function sendMinified( response, text ) {
	stats.requestsResponded++;
	response.writeHead( 200, { 'Content-Type': 'application/javascript' } );
	response.write( text );
	response.end();
}

function log( str ) {
	console.log( '[server] ' + str );
}

function md5( data ) {
	var hash = crypto.createHash( 'md5' );
	hash.update( data );
	return hash.digest( 'hex' );
}

/**
 * Sets up multithreading
 */
function setupCluster() {
	cluster.setupMaster( { exec: 'worker.js' } );

	cluster.on( 'disconnect', function( worker ) {
		log( 'Worker ' + worker.id + ' has disconnected, cleaning up and restarting.' );
		stats.workerErrors++;
		if ( worker.work ) {
			worker.work.failed( 'Worker disconnection' );
		}
		var newWorker = cluster.fork();
		setupWorker( newWorker );
		var work = queue.unshift();
		if ( work ) {
			work.sendToWorker( worker );
		}
	} );

	cluster.on( 'exit', function( worker, code, signal ) {
		var s = 'Worker ' + worker.id + ' has exited with code ' + code;
		if ( signal !== null ) {
			s += ' upon signal ' + signal;
		}
		s += '.';
		log( s );
	} );

	var cpus = os.cpus().length;
	log( 'Started, pid=' + process.pid + '. Spawning ' + cpus + ' workers.' );
	for ( var i = 0; i < cpus; i++ ) {
		var worker = cluster.fork();
		setupWorker( worker );
	}
}

function setupWorker( worker ) {
	worker.on( 'message', function( msg ) {
		if ( msg.code === 'minified' ) {
			if ( !worker.currentWork || msg.id != worker.currentWork.id ) {
				log( 'Worker #' + worker.id + ': unexpected work ' + msg.id );
			}
			worker.currentWork.done( msg.text );
		}
	} );
}

/**
 * Class that represents a request waiting for completion
 * @param response
 * @constructor
 */
function PendingRequest( response ) {
	this.response = response;
	this.live = true;

	var thisSaved = this;
	this.timer = setTimeout( function() { thisSaved.timeout(); }, config.main.network.timeout );
}

PendingRequest.prototype = {
	timeout: function() {
		stats.requestTimeouts++;
		reportError( this.response, 500, 'Internal Server Error', 'Timed out' );
		log( 'Request timeout' );
		this.destroy();
	},

	respond: function( code, type, content ) {
		if ( !this.live ) {
			return;
		}
		this.response.writeHead( code, { 'Content-Type': type } );
		this.response.write( content );
		this.response.end();
		this.destroy();
	},

	destroy: function() {
		clearTimeout( this.timer );
		this.live = false;
	}
};