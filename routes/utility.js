var fs = require('fs');
var logger = require('tracer').colorConsole();

exports.mkdirSync = function (path) {
	//logger.debug(path);

	try {
		fs.mkdirSync(path);
	} catch(e) {
		if (e.code != 'EEXIST'){
			logger.error(e);
			throw e;  	
		}
	}
};