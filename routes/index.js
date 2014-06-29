var express = require('express');
var router = express.Router();
var logger = require('tracer').colorConsole();
var User = require('../models/User.js');
var Post = require('../models/Post.js');


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

/* post view */

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

/* GET home page. */
router.get('/', postsAll);

/* user signin/up/out */
router.get('/signup', signup);
router.get('/signin', signin);
router.get('/signout', signout);
router.post('/signup', register);
router.post('/signin', login);

/* post view */
router.get('/u/:username', postsByUserCtrl);
router.get('/c/:category', postsByCategoryCtrl);
//router.get('/p/:url', post);

//router.get('/category/:cate', cate);


module.exports = router;
