/**
 * Server statistics
 * @type Object
 */
module.exports = {
	// Number of requests received
	requests: 0,

	// Number of minification requests that received an error response
	requestErrors: 0,
	requestsResponded: 0,
	requestTimeouts: 0,
	//disconnects: 0,
	minificationTime: 0,
	workerErrors: 0,
	cacheHits: 0,
	cacheMisses: 0,
	queueHits: 0,
	queueMisses: 0,
	queueLength: 0
};
