var utils = require( './utils' );

function Work( id, text, request ) {
	this.id = id;
	this.text = text;
	this.requests = [request];
}

Work.prototype = {
	done: function( text ) {
		this.respond( 200, 'application/javascript', text );
	},

	failed: function( reason ) {
		this.respond( 500, 'text/html', utils.errorPage( 500, 'Internal Server Error', reason ) );
	},

	respond: function( code, type, content ) {
		for ( var i = 0; i < this.requests.length; i++ ) {
			this.requests[i].respond( code, type, content )
		}
	},

	sendToWorker: function( worker ) {
		worker.work = this;
		worker.send( { code: 'minify', id: this.id, text: this.text } );
	}
};

module.exports = Work;