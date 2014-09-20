var fs = require('fs');
var logger = require('tracer').colorConsole();

exports.dateToString = function(date) {
	var year = date.getFullYear();
	var month = date.getMonth()+1;
	var day = date.getDate();
	if (month < 10){
		month = '0' + month;
	}
	if (day < 10){
		day = '0' + day;
	}

	return year+'/'+month+'/'+day;
};


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