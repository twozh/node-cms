var express = require('express');
var router = express.Router();
var logger = require('tracer').colorConsole();
//var User = require('../models/User.js');
var Post = require('../models/Post.js');
var marked = require('marked');
var util = require('./utility.js');
var formidable = require('formidable');
var utilSys = require('util');
var fs = require('fs');

marked.setOptions({
	renderer: new marked.Renderer(),
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: true,
	smartLists: true,
	smartypants: false
});

/* view post */

/* render posts */
var renderPosts = function(err, posts, req, res){
	var render = {
		username: req.session.username,
		posts: posts
	};

	if (err){
		logger.error(err);
		render.title = "404 page not found";
		render.message = err.message;
		return res.render('../views/error.jade', render);
	}

	for (var i=0; i<posts.length; i++){
		posts[i].dateString = util.dateToString(posts[i].postTime);
		posts[i].contentAfterMarked = marked(posts[i].content.full);
	}

	return res.render('templates/posts.jade', render);
};

var postsAll = function(req, res){
	Post.postsAll(function(err, posts){
		return renderPosts(err, posts, req, res);
	});
};

var postsByUserCtrl = function(req, res){
	Post.postsByUser(req.params.username, function(err, posts){
		return renderPosts(err, posts, req, res);
	});
};

var postsByCategoryCtrl = function(req, res){
	Post.postsByCategory(req.params.category, function(err, posts){
		return renderPosts(err, posts, req, res);
	});
};

var postsByYear = function(req, res){
	var year = parseInt(req.params[0]);
	var startDate = new Date();
	var endDate   = new Date();
	startDate.setFullYear(year, 0, 1);
	startDate.setHours(0, 0, 0, 0);
	endDate.setFullYear(year+1, 0, 1);
	endDate.setHours(0, 0, 0, 0);

	logger.debug(startDate, '  ', endDate);

	Post.postsByDate(startDate, endDate, function(err, posts){
		return renderPosts(err, posts, req, res);
	});
};

var postsByMonth = function(req, res){
	var year  = parseInt(req.params[0]);
	var month = parseInt(req.params[1]);
	if (month <= 0 || month > 12){
		return renderPosts(new Error("Month is invalid."), null, req, res);
	}

	var startDate = new Date();
	var endDate   = new Date();
	startDate.setFullYear(year, month-1, 1);
	startDate.setHours(0, 0, 0, 0);
	endDate.setFullYear(year, month, 1);
	endDate.setHours(0, 0, 0, 0);
	logger.debug(startDate, '  ', endDate);
	Post.postsByDate(startDate, endDate, function(err, posts){
		return renderPosts(err, posts, req, res);
	});
};

var postsByDate = function(req, res){
	var year  = parseInt(req.params[0]);
	var month = parseInt(req.params[1]);
	var date  = parseInt(req.params[2]);
	if (month <= 0 || month > 12){
		return renderPosts(new Error("Month is invalid."), null, req, res);
	}
	if (date <= 0 || date > 31){
		return renderPosts(new Error("Date is invalid."), null, req, res);
	}

	var startDate = new Date();
	var endDate   = new Date();
	startDate.setFullYear(year, month-1, date);
	startDate.setHours(0, 0, 0, 0);
	endDate.setFullYear(year, month-1, date+1);
	endDate.setHours(0, 0, 0, 0);
	logger.debug(startDate, '  ', endDate);
	Post.postsByDate(startDate, endDate, function(err, posts){
		return renderPosts(err, posts, req, res);
	});
};

var postsByDaterangeCtrl = function(req, res){
	/* validate year */
	var d = new Date();
	if (req.params[0] > d.getFullYear() || req.params[0] < 1900){
		return renderPosts(new Error("Year is invalid."), null, req, res);
	}

	if (req.params[1] === undefined){
		return postsByYear(req, res);
	} else if(req.params[2] === undefined){
		return postsByMonth(req, res);
	} else {
		return postsByDate(req, res);
	}
};

var postSingle = function(req, res){
	var year  = parseInt(req.params[0]);
	var month = parseInt(req.params[1]);
	var date  = parseInt(req.params[2]);

	/* validate year */
	var d = new Date();
	if (year > d.getFullYear() || year < 1900){
		return renderPosts(new Error("Year is invalid."), null, req, res);
	}
	if (month <= 0 || month > 12){
		return renderPosts(new Error("Month is invalid."), null, req, res);
	}
	if (date <= 0 || date > 31){
		return renderPosts(new Error("Date is invalid."), null, req, res);
	}

	var url = req.params[3];

	var render = {
		username: req.session.username,
	};

	var startDate = new Date();
	var endDate   = new Date();
	startDate.setFullYear(year, month-1, date);
	startDate.setHours(0, 0, 0, 0);
	endDate.setFullYear(year, month-1, date+1);
	endDate.setHours(0, 0, 0, 0);

	Post.postByDateAndUrl(startDate, endDate, url, function(err, posts){
		if (err){
			logger.error(err);
			render.title = "Error";
			render.message = err.message;
			return res.render('../views/error.jade', render);
		}
		
		if (posts.length === 0){
			render.title = "Error";
			render.message = "Not found";
			return res.render('../views/error.jade', render);
		}

		render.post = posts[0];
		render.post.contentAfterMarked = marked(posts[0].content.full);
		return res.render('templates/post.jade', render);
	});


};

/* new post */
var newPostGet = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}

	var render = {
		username: req.session.username,
		fileid: req.params.postid,
		post: {},
	};

	logger.debug(req.params.postid);
	if (req.params.postid){
		Post.postByPostId(req.params.postid, function(err, post){
			if (err){

			} else{
				render.post = post;
				logger.debug(post);
			}
			
			return res.render('templates/new-post.jade', render);
		});
	} else{
		return res.render('templates/new-post.jade', render);
	}	
};

var newPostPost = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}	

	logger.debug(req.body);
	var newPost = req.body;
	newPost.author = req.session.userid;
	if (!newPost.image){
		newPost.image=[];
	}
	var cb = function(err){
		if (err){
			logger.error(err);
			return res.send({status: 'err', msg: err.message});
		}
		res.send({status: 'succ', msg: "Create/Update new article success.", name:req.session.username});
		//res.redirect('/admin/'+req.session.username);
	};

	if (req.body.postid){
		Post.update(req.body.postid, newPost, cb);
	} else{
		Post.create(newPost, cb);
	}
};

var delPost = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}

	Post.delete(req.body.postid, function(err){
		if (err){
			logger.error(err);
			return res.send({status: 'err', msg: err.message});
		}

		return res.send({status: 'succ', msg: "del post succ."});
	});
};

var upload = function(req, res){
	var uploadPath = "public/image/upload/";
	var d = new Date();
	
	/* check or create dir, name by year */
	uploadPath += d.getFullYear();
	util.mkdirSync(uploadPath);

	/* check or create dir, name by month */
	uploadPath += "/" + (d.getMonth()+1) + "/";
	util.mkdirSync(uploadPath);

	var form = new formidable.IncomingForm();
	form.uploadDir = uploadPath;

	form.parse(req, function(err, fields, files) {
		logger.debug(fields, files);
		var image = files.image;
		var imgsrc = uploadPath+d.getTime()+image.name.substr(-4);
		fs.rename(image.path, imgsrc, function(err){
			if (err){
				logger.error(err);
				return res.send({status: 'err', msg: "fs.rename fail"});	
			}
			logger.debug("upload file name is", imgsrc);
			return res.send({status: 'succ', 
							 msg: "Upload succ.",
							 path: imgsrc.substr(6),
							});
		});
	});

};

var deleteImg = function(req, res){
	logger.debug(req.body);

	var delPath = "public" + req.body.path;
	fs.unlink(delPath, function(err){
		if (err)
			logger.error(err);

		res.send({status: "succ", msg: "del succ."});
	});	
};

var admin = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}	
	var render = {
		username: req.session.username
	};

	Post.postsByUser(req.params.username, function(err, posts){
		for (var i=0; i<posts.length; i++){
			posts[i].dateString = util.dateToString(posts[i].postTime);
		}

		render.posts = posts;
		return res.render('templates/admin.jade', render);
	});	
};

/* GET home page. */
router.get('/', postsAll);

/* view post */
router.get('/u/:username', postsByUserCtrl);
router.get('/c/:category', postsByCategoryCtrl);
router.get(/^\/(\d{4})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([\w-]+)$/, postSingle);

/* user panel */
router.get('/admin/:username', admin);

/* new post */
router.get('/new', newPostGet);
router.get('/new/:postid', newPostGet);
router.post('/new/delPost', delPost);

router.post('/new', newPostPost);
router.post('/new/upload', upload);
router.post('/new/delete', deleteImg);

module.exports = router;
