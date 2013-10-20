module.exports = Request;

var log = require( './server' ).log,
	config = require( './config' ),
	stats = require( './stats' );

/**
 * Class that represents a request waiting for completion
 * @param callback
 * @constructor
 */
function Request( callback ) {
	this.callback = callback;
	this.live = true;

	var self = this;
	this.timer = setTimeout( function() { self.timeout(); }, config.main.network.timeout );
}

Request.prototype = {
	timeout: function() {
		stats.requestTimeouts++;
		this.respond( '', 'Timed out' );
	},

	success: function( text ) {
		stats.requestsResponded++;
		this.respond( text );
	},

	error: function( msg ) {
		stats.requestErrors++;
		this.respond( '', msg );
	},

	respond: function( text, err ) {
		if ( !this.live ) {
			return;
		}
		clearTimeout( this.timer );
		this.live = false;
		this.callback( text, err );
	}
};
