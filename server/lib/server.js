var cluster = require( 'cluster' );
var os = require( 'os' );
var lru = require( 'lru-cache' );
var crypto = require( 'crypto' );
var config = require( './config' );
var Work = require( './work' );
var stats = require( './stats' );
var Request = require( './request.js' );

function log( str ) {
	console.log( '[server] ' + str );
}

function md5( data ) {
	var hash = crypto.createHash( 'md5' );
	hash.update( data );
	return hash.digest( 'hex' );
}

module.exports = {
	/**
	 * Sets up multithreading
	 */
	init: function() {
		cluster.setupMaster( { exec: './worker.js' } );

		cluster.on( 'disconnect', function( worker ) {
			log( 'Worker ' + worker.id + ' has disconnected, cleaning up and restarting.' );
			stats.workerErrors++;
			if ( worker.work ) {
				worker.work.failed( 'Worker disconnection' );
			}
			var newWorker = cluster.fork();
			this.setupWorker( newWorker );
			this.checkQueue( newWorker );
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
			this.setupWorker( worker );
		}
	},

	log: log,

	cache: lru( {
		max: config.main.queue.sizeInMB * 1024 * 1024,
		length: function( s ) { return s.length; }
	} ),

	queue: [],

	minify: function( id, text, callback ) {
		stats.requests++;
		if ( typeof id === 'undefined' ) {
			id = md5( text );
		}
		var cached = this.cache.get( id );
		if ( typeof cached !== 'undefined' ) {
			stats.cacheHits++;
			log( 'Cache hit for id ' + id );
			callback( cached );
		} else {
			var pending = new Request( callback )
			// @todo: Non-linear search?
			if ( !this.sendToFreeWorker( id, text, pending ) ) {
				this.enqueue( id, text, pending )
			}
		}
	},

	saveToCache: function( id, text ) {
		this.cache.set( id, text );
	},

	getFreeWorker: function() {
		for ( var workerId in cluster.workers ) {
			var worker = cluster.workers[workerId];
			if ( !worker.currentWork ) {
				return worker;
			}
		}
		return false;
	},

	sendToFreeWorker: function( id, text, pending ) {
		var worker = this.getFreeWorker();
		if ( worker ) {
			var work = new Work( id, text, pending );
			work.sendToWorker( worker );
			log( 'Sending work ' + id + ' to worker #' + worker.id );
			return true;
		}
		return false;
	},

	enqueue: function( id, text, request ) {
		for ( var i = 0; i < this.queue.length; i++ ) {
			if ( this.queue[i].id == id ) {
				this.queue[i].requests.push( request );
				return;
			}
		}
		this.queue.push( new Work( id, text, request ) );
	},

	setupWorker: function( worker ) {
		var self = this;
		worker.on( 'message', function( msg ) {
			if ( msg.code === 'minified' ) {
				if ( !worker.currentWork || msg.id != worker.currentWork.id ) {
					log( 'Worker #' + worker.id + ': unexpected work ' + msg.id );
					return;
				}
				self.saveToCache( msg.id, msg.text );
				worker.currentWork.done( msg.text );
				delete worker.currentWork;
				self.checkQueue( worker );
			}
		} );
	},

	/**
	 * Sends a queued object to a free worker
	 */
	checkQueue: function( freeWorker ) {
		if ( this.queue.length ) {
			if ( !freeWorker ) {
				freeWorker = this.getFreeWorker();
			}
			if ( freeWorker ) {
				var work = this.queue.shift();
				work.sendToWorker( freeWorker );
				log( 'Work ' + work.id + ' sent to worker #' + freeWorker.id );
			} else {
				log( 'checkQueue(): no free workers found. This should not happen.' );
			}
		}
	}
};