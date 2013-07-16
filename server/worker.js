var cluster = require( 'cluster' );
var uglify = require( 'uglify-js' );
var fs = require( 'fs' );

if ( cluster.isMaster ) {
	console.error( "This program can't be run directly" );
	process.exit( 1 );
}

var logPrefix = '[worker#' + cluster.worker.id + '] ';

process.on( 'message', function( msg ) {
	console.log(msg);
	switch( msg.code ) {
		case 'minify':
			minify( msg.id, msg.text )
			break;
	}
} );

function minify( id, text ) {
	var time = process.hrtime();
	text = uglify.minify( text, { fromString: true } );
	time = process.hrtime( time );
	time = time[0] * 1e6 + time[1] / 1000;
	log( 'Minified JS fragment ' + id + ' in ' + time + 'us.' );
	process.send( { code: 'minified', id: id, text: text, time: time } );
}

log( 'Ready, pid=' + process.pid );

function log( str ) {
	console.log( logPrefix + str );
}
