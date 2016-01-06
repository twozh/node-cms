var config = require('../config.js');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../user').User;
var logger = require('tracer').colorConsole();

var postSchema = new Schema({
	title	: {type: String, required: true},
	author	: {type: Schema.Types.ObjectId, ref: 'User', required: true},
	category: {type: String, enum: config.postCatogary, required: true},
	content	: {
		full : {type: String, required: true},
	},
	postTime: {type: Date, default: Date.now, required: true},
	state	: {type: String, enum: ['draft', 'published']},
	publishedPostId: {type: Schema.Types.ObjectId, ref: 'Post'},
	draftId	: {type: Schema.Types.ObjectId, ref: 'Draft'},
	image	: [String],
	url		: {type: String, required: true},

});

postSchema.statics.postsByDate = function(startDate, stopDate, cb){
	Post.find()
		.where('postTime').gte(startDate).lte(stopDate)
		.sort('-postTime')
		.populate('author')
		.exec(function(err, posts){
			if(err){
				logger.error(err);
				return cb(err);
			}
			cb(null, posts);
		});
};

postSchema.statics.postByDateAndUrl = function(startDate, stopDate, url, cb){
	Post.find({url: url})
		.where('postTime').gte(startDate).lte(stopDate)
		.sort('-postTime')
		.populate('author')
		.exec(function(err, posts){
			if(err){
				logger.error(err);
				return cb(err);
			}
			logger.debug(posts.length);
			cb(null, posts);
		});
};

postSchema.methods.makeUrlWithDate = function(){
	var year = this.postTime.getFullYear();
	var month = this.postTime.getMonth()+1;
	var day = this.postTime.getDate();
	if (month < 10){
		month = '0' + month;
	}
	if (day < 10){
		day = '0' + day;
	}

	return year+'/'+month+'/'+day+'/'+this.url;
};

postSchema.methods.postDateToString = function(){
	var year = this.postTime.getFullYear();
	var month = this.postTime.getMonth()+1;
	var day = this.postTime.getDate();
	var hour = this.postTime.getHours();
	var min = this.postTime.getMinutes();

	month 	= month < 10 ? ('0'+month) : month;
	day 	= day < 10 ? ('0'+day) : day;
	hour 	= hour < 10 ? ('0'+hour) : hour;
	min 	= min < 10 ? ('0'+min) : min;

	return year+'/'+month+'/'+day+' '+hour+':'+min;
};

postSchema.methods.categoryToString = function(){
	var str;

	switch (this.category) {
		case 'tech':
			str = '技术';
			break;
		case 'business':
			str = '业界';
			break;
		default:
			str = '其它';
	}

	return str;
};


var Post = mongoose.model('Post', postSchema);
var Draft = mongoose.model('Draft', postSchema);

exports.Post = Post;
exports.Draft = Draft;


