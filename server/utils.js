module.exports = {
	errorPage: function( code, name, message ) {
		return '<!doctype html><html><title>Error</title><body><h1>' + code + ' '
			+ name + '</h1>' + message + '</body></html>';
	}
};
