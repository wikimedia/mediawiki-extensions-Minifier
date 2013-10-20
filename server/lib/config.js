var fs = require('fs' );

function Config() {
	this.files = {};
	this.verbose = true;
}

Config.prototype = {
	load: function( name, file ) {
		this.files[name] = file;
		var json = fs.readFileSync( file, { encoding: 'ascii' } );
		this[name] = JSON.parse( json );
		return this[name];
	},

	reload: function() {
		for ( var name in this.files ) {
			this.load( name, this.files[name] );
		}
	},
};

module.exports = new Config;
