/*
 * GET root page with statistics
 */

var stats = require( '../lib/stats' );

exports.index = function( req, res ) {
	if ( stats.requestsResponded ) {
		stats.minificationTime /= stats.requestsResponded;
	}
	stats.pendingRequests = stats.requests - stats.requestErrors - stats.requestsResponded;

	if ( req.param( 'format' ) == 'json' ) {
		res.writeHead( 200, { 'Content-Type': 'application/json' } );
		res.write( JSON.stringify( stats, '', '\t' ) );
		res.end();
	} else {
		res.render( 'index', { title: 'Minification server statistics', stats: stats } );
	}
};