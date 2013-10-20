/**
 * JavaScript minification server
 * API:
 *  GET / - returns statistics
 *  POST / - returns minified JS. Parameters:
 *  - text - JS to minify
 *  - id - cache ID for this JS chunk [optional]
 */

var config = require( './lib/config' );
config.load( 'main', 'settings.json' );

var express = require( 'express' ),
	routes = require( './routes' ),
	minify = require( './routes/minify' ),
	http = require( 'http' ),
	path = require( 'path' ),
	server = require( './lib/server' );


var app = express();
server.init();

// all environments
app.set( 'port', config.main.network.port );
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'jade' );
app.use( express.favicon() );
app.use( express.logger( 'dev') );
app.use( express.bodyParser() );
app.use( express.methodOverride() );
app.use( app.router );
app.use( express.static( path.join( __dirname, 'public' ) ) );

// development only
if ( 'development' == app.get( 'env' ) ) {
	app.use( express.errorHandler() );
}

app.get( '/', routes.index );
app.post( '/', minify.post );

http.createServer( app ).listen( app.get( 'port' ), function() {
	console.log( 'Express server listening on port ' + app.get( 'port' ) );
});
