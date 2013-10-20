/*
 * POST to home page - minify
 */

var server = require( '../lib/server' );

exports.post = function( req, res ) {
	var text = req.param( 'text' );
	var id = req.param( 'id' );

	server.minify( id, text, function( text, err ) {
		if ( typeof err === 'undefined' ) {
			res.writeHead( 200, { 'Content-Type': 'application/javascript' } );
			res.write( text );
		} else {
			res.writeHead( 500, { 'Content-Type': 'text/plain' } );
			res.write( err );
		}
		res.end();
	} );
};
