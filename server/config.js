var fs = require('fs');
var util = require('util');

function Config() {
	this.files = {};
	this.verbose = true;
}

Config.prototype = {
	load: function(name, file) {
		this.log('Loading configuration file ' + file);
		this.files[name] = file;
		var json = fs.readFileSync(file, {encoding: 'ascii'});
		this[name] = JSON.parse(json);
		return this[name];
	},

	reload: function() {
		this.log('Reloading configuration');
		for (var name in this.files) {
			this.load(name, this.files[name]);
		}
	},

	log: function(line) {
		if (this.verbose) {
			console.log(line);
		}
	}
};

module.exports = new Config;
