var express = require('express');
var router = express.Router();
var logger = require('tracer').colorConsole();
var User = require('../models/User.js');
var Post = require('../models/Post.js');
var marked = require('marked');
var util = require('./utility.js');
var formidable = require('formidable');
var utilSys = require('util');
var fs = require('fs');

/* signup/in/out */
var signup = function(req, res){
	res.render('templates/signup.jade', {title: 'Signup'});
};

var signin = function(req, res){
	res.render('templates/signin.jade', {title: 'Signin'});
};

var register = function(req, res){
	var postData = req.body;
	logger.debug("postData ", postData);

	User.create(postData, function(err, msg){
		if (err){
			logger.info(err);
			return res.send({status: 'err', msg: err.message});
		}
		res.send(msg);
	});
};

var login = function(req, res){
	var postData = req.body;

	User.auth(postData.name, postData.pass, function(err, userid){
		if (err){
			logger.error(err);
			return res.send({status: "err", msg: err.message});
		}

		logger.debug("login succ ", postData, userid);
		req.session.regenerate(function(){
			req.session.userid = userid;
			req.session.username = postData.name;
			req.session.auth = true;
			return res.send({status: "succ", msg: "Login OK! Welcom!"});
	    });
	});
};

var signout = function(req, res){
	req.session.destroy(function(){
    		res.redirect('/');
	});
};

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

		logger.debug(posts);
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
		return res.redirect("/signin");
	}
	var render = {
		username: req.session.username,
	};

	return res.render('templates/new-post.jade', render);
};

var newPostPost = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/signin");
	}

	logger.debug(req.body);
	var newPostData = req.body;
	newPostData.author = req.session.userid;
	Post.create(newPostData, function(err){
		if (err){
			logger.error(err);
			return res.send({status: 'err', msg: err.message});
		}
		res.send({status: 'succ', msg: "Create new article success."});
	});
};

var upload = function(req, res){
	var uploadPath = "public/image/upload/";
	var d = new Date();
	
	/* check or create dir, name by year */
	uploadPath += d.getFullYear();
	util.mkdirSync(uploadPath);

	/* check or create dir, name by month */
	uploadPath += "/" + (d.getMonth()+1);
	util.mkdirSync(uploadPath);

	var form = new formidable.IncomingForm();
	form.uploadDir = uploadPath;
	form.parse(req, function(err, fields, files) {
		res.writeHead(200, {'content-type': 'text/plain'});
		res.write('received upload:\n\n');
		res.end(utilSys.inspect({fields: fields, files: files}));
	});

};


/* GET home page. */
router.get('/', postsAll);

/* user signin/up/out */
router.get('/signup', signup);
router.get('/signin', signin);
router.get('/signout', signout);
router.post('/signup', register);
router.post('/signin', login);

/* view post */
router.get('/u/:username', postsByUserCtrl);
router.get('/c/:category', postsByCategoryCtrl);
router.get(/^\/(\d{4})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([\w-]+)$/, postSingle);


/* new post */
router.get('/new', newPostGet);
router.post('/new', newPostPost);
router.post('/upload', upload);

module.exports = router;
