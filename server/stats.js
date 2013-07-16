var humanNames = {
	requests: 'Total requests',
	requestErrors: 'Request errors',
	requestsResponded: 'Requests served',
	pendingRequests: 'Pending requests',
	//disconnects: '',
	minificationTime: 'Average minification time',
	workerErrors: 'Worker errors'
};

var formats = {
	html: { renderer: renderStatsHtml, type: 'text/html' },
	text: { renderer: renderStatsText, type: 'text/plain' },
	json: { renderer: renderStatsJson, type: 'application/json' }
}

function renderStats( stats, format ) {
	if ( stats.requestsResponded ) {
		stats.minificationTime /= stats.requestsResponded;
	}
	stats.pendingRequests = stats.requests - stats.requestErrors - stats.requestsResponded;

	if ( formats[format] ) {
		return { output: formats[format].renderer( stats ), type: formats[format].type };
	}
	return { output: '', type: 'text/html' };
}

function renderStatsHtml( stats ) {
	var s = '<!doctype html><html><title>Minifier server statistics</title><body>';

	s += '<table>';
	for ( var name in humanNames ) {
		s += '<tr><td>' + humanNames[name] + '</td><td>' + stats[name] + '</td></tr>';
	}
	s += '</table><hr>';
	s += '<form method="POST" action="/"><textarea name="text" rows="10" cols="80"></textarea><br><input type="submit" value="Minify!"/></form>';
	s += '</body></html>';
	return s;
}

function renderStatsText( stats ) {
	var s = '';
	for ( var name in humanNames ) {
		s += humanNames[name] + ': ' + stats[name] + '\n';
	}
	return s;
}

function renderStatsJson( stats ) {
	return JSON.stringify( stats );
}

module.exports.render = renderStats;
