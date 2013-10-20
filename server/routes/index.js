/*
 * GET root page with statistics
 */

var stats = require( '../lib/stats' );

exports.index = function( req, res ) {
	if ( stats.requestsResponded ) {
		stats.minificationTime /= stats.requestsResponded;
	}
	stats.pendingRequests = stats.requests - stats.requestErrors - stats.requestsResponded;

	res.render( 'index', { title: 'Minification server statistics', stats: stats } );
};