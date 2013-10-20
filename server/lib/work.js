function Work( id, text, request ) {
	this.id = id;
	this.text = text;
	this.requests = [request];
}

Work.prototype = {
	done: function( text ) {
		this.respond( 'success', text );
	},

	failed: function( reason ) {
		this.respond( 'failed', '', reason );
	},

	respond: function( method, param1, param2 ) {
		for ( var i = 0; i < this.requests.length; i++ ) {
			this.requests[i][method]( param1, param2 );
		}
	},

	sendToWorker: function( worker ) {
		worker.currentWork = this;
		worker.send( { code: 'minify', id: this.id, text: this.text } );
	}
};

module.exports = Work;
