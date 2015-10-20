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
		brief: String,
		full : {type: String, required: true},
	},
	postTime: {type: Date, default: Date.now, required: true},
	state	: {type: String, enum: ['draft', 'published']},
	image	: [String],
	url		: {type: String, required: true},

});

postSchema.statics.create = function(obj, cb){
	var newPost = new Post(obj);
	newPost.save(function(err){
		if (err) {
			logger.error(err);
			return cb(err);
		}
		cb(null);
	});
};

postSchema.statics.update = function(id, obj, cb){
	Post.findByIdAndUpdate(id, obj, function(err, post){
		logger.debug(id, obj);
		if (err){
			return cb(err);
		}
		cb(null);
	});
};

postSchema.statics.delete = function(id, cb){
	Post.findByIdAndRemove(id, function(err){
		if (err){
			return cb(err);
		}
		cb(null);
	});
};

postSchema.statics.postsAll = function(cb){
	Post.find().sort('-postTime').populate('author').exec(function(err, posts){
		if(err){
			logger.error(err);
			return cb(err);
		}
		logger.debug(posts.length);
		cb(null, posts);
	});
};

postSchema.statics.posts_by_author = function(author, cb){
	Post.find({author: author}).sort('-postTime').populate('author').exec(function(err, posts){
		if(err){
			logger.error(err);
			return cb(err);
		}
		logger.debug(posts.length);
		cb(null, posts);
	});
};

postSchema.statics.postsByUser = function(name, cb){
	User.findOne({name: name}, function(err, user){
		if (err){
			logger.error(err);
			return cb(err);
		}
		if (user === null){
			return cb(new Error("User dose not exist."));
		}
		Post.find({author: user._id}).sort('-postTime').populate('author').exec(function(err, posts){
			if(err){
				logger.error(err);
				return cb(err);
			}
			logger.debug(posts.length);
			cb(null, posts);
		});
	});
};

postSchema.statics.postsByCategory = function(category, cb){
	/* validate the category */
	for (var i = 0; i < config.postCatogary.length; i++){
		if (category === config.postCatogary[i]) break;
	}
	if (i === config.postCatogary.length){
		return cb(new Error("Category is invalid!"));
	}

	Post.find({category: category}).sort('-postTime').populate('author').exec(function(err, posts){
		if(err){
			logger.error(err);
			return cb(err);
		}
		logger.debug(posts.length);
		cb(null, posts);
	});
};

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
			logger.debug(posts.length);
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

postSchema.statics.postByPostId = function(postid, cb){
	Post.findById(postid, function(err, post){
		if(err){
			logger.error(err);
			return cb(err);
		}
		cb(null, post);
	});
};


var Post = mongoose.model('Post', postSchema);

module.exports = Post;

