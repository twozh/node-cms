var express = require('express');
var router = express.Router();
var logger = require('tracer').colorConsole();
//var User = require('../models/User.js');
var Post = require('../models/Post.js').Post;
var Draft = require('../models/Post.js').Draft;
var User = require('../user').User;
var marked = require('marked');
var util = require('./utility.js');
var formidable = require('formidable');
var utilSys = require('util');
var fs = require('fs');
var config = require('../config.js');

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
	var renderObj = {};
	if (err){
		logger.error(err);
		renderObj.title = "404 page not found";
		renderObj.message = err.message;
		renderObj.error = err;
		return res.render('../views/error.jade', renderObj);
	}

	for (var i=0; i<posts.length; i++){
		posts[i].urlWithDate = posts[i].makeUrlWithDate();
		posts[i].postDateString = posts[i].postDateToString();		
		posts[i].categoryString = posts[i].categoryToString();
	}

	renderObj.posts = posts;

	return res.render('templates/posts.jade', renderObj);
};

var postsAll = function(req, res){
	Post.find().sort('-postTime').populate('author').exec(function(err, posts){
		renderPosts(err, posts, req, res);
	});
};

var postsByUserCtrl = function(req, res){
	User.findById(req.params.userid, function(err, user){
		if (err){
			logger.error(err);
			return renderPosts(err, null, req, res);
		}
		if (user === null){
			return renderPosts(new Error("User dose not exist."), null, req, res);
		}
		Post.find({author: user._id}).sort('-postTime').populate('author').exec(function(err, posts){
			if(err){
				logger.error(err);
				return renderPosts(err);
			}

			renderPosts(null, posts, req, res);
		});
	});
};

var postsByCategoryCtrl = function(req, res){
	var category = req.params.category;

	/* validate the category */
	for (var i = 0; i < config.postCatogary.length; i++){
		if (category === config.postCatogary[i]) break;
	}
	if (i === config.postCatogary.length){
		return renderPosts(new Error("Category is invalid!"), null, req, res);
	}

	Post.find({category: category}).sort('-postTime').populate('author').exec(function(err, posts){
		if(err){
			logger.error(err);
			return renderPosts(err, null, req, res);
		}

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

		var post = posts[0];
		post.contentAfterMarked = marked(posts[0].content.full);
		post.categoryString = post.categoryToString();
		post.postDateString = post.postDateToString();
		render.post = post;
		return res.render('templates/post.jade', render);
	});
};

/* new post */
var newPostGet = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}	

	var render = {
		draftid: null,
		postid: null,
		post: {}
	};

	if (req.params.postid){
		var state = req.query.state;

		if (state === 'draft'){
			Draft.findById(req.params.postid, function(err, draft){
				if (err){
					logger.error(err);
					return res.send(err.message);
				}

				render.post = draft;
				render.draftid = draft._id;
				render.postid = draft.publishedPostId;
				return res.render('templates/new-post.jade', render);
			});
		} else if (state === 'published'){
			Post.findById(req.params.postid, function(err, post){
				if (err){
					logger.error(err);
					return res.send(err.message);
				}

				render.post = post;
				render.draftid = post.draftId;
				render.postid = post._id;
				return res.render('templates/new-post.jade', render);
			});
		} else{
			logger.error('Wrong state: '+state);
			return res.send('Error');
		}

	} else{
		return res.render('templates/new-post.jade', render);
	}	
};

var preparePost = function(req){
	var post = req.body;
	post.author = req.session.userid;
	post.url = post.url.trim().replace(/\s/g, '_');
	post.content = {};
	post.content.full = post['content[full]'];
	if (!post.image){
		post.image=[];
	}

	return post;
};

var newPostCtrl = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}	

	var newPost = preparePost(req);
	newPost.state = 'published';
	newPost.draftId = null;
	
	var cb = function(err){
		if (err){
			logger.error(err);
			return res.send({status: 'err', msg: err.message});
		}

		//if exist draft, delete the draft
		if (newPost.draftid){
			return Draft.findByIdAndRemove(newPost.draftid).exec(function(err){
				if (err){
					logger.error(err);
					return res.send({status: 'err', msg: err.message});
				}
				
				res.send({status: 'succ', msg: "Create/Update new article success.", name:req.session.username});				
			});
		}
			
		res.send({status: 'succ', msg: "Create/Update new article success.", name:req.session.username});		
	};

	//no postid, create a new post
	if (!newPost.postid){
		var newPostModel = new Post(newPost);
		return newPostModel.save(function(err){
			cb(err);
		});
	}

	//otherwise update the post
	Post.findByIdAndUpdate(newPost.postid, newPost, cb);
};

var newDraftCtrl = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}

	var newDraft = preparePost(req);
	newDraft.state = 'draft';
	newDraft.publishedPostId = newDraft.postid;

	var cb = function(err, draft){
		if (err){
			logger.error(err);
			return res.send({status: 'err', msg: err.message});
		}

		if (newDraft.postid && !newDraft.draftid){
			return Post.findByIdAndUpdate(newDraft.postid, {draftId: draft._id}, function(err){
				if (err){
					logger.error(err);
					return res.send({status: 'err', msg: err.message});
				}

				res.send({status: 'succ', msg: "Create/Update new draft success.", name:req.session.username});
			});
		}

		res.send({status: 'succ', msg: "Create/Update new draft success.", name:req.session.username});
	};

	//no draftid, create new draft
	if (!newDraft.draftid){
		var newDraftModel = new Draft(newDraft);
		return newDraftModel.save(function(err, m){
			if (err){
				logger.error(err);
				return res.send({status: 'err', msg: err.message});
			}

			cb(null, m);
		});
	}

	//have draftid, update draft
	Draft.findByIdAndUpdate(newDraft.draftid, newDraft, cb);
};

var delPost = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}

	if (req.body.state === 'published'){
		return Post.findByIdAndRemove(req.body.postid, function(err){
			if (err){
				logger.error(err);
				return res.send({status: 'err', msg: err.message});
			}

			return res.send({status: 'succ', msg: "del post succ."});
		});
	} else if (req.body.state === 'draft'){
		Draft.findByIdAndRemove(req.body.postid, function(err, draft){
			if (err){
				logger.error(err);
				return res.send({status: 'err', msg: err.message});
			}

			if (draft && draft.publishedPostId){
				Post.findByIdAndUpdate(draft.publishedPostId, {draftId: null}, function(err){
					if (err){
						logger.error(err);
						return res.send({status: 'err', msg: err.message});
					}

					return res.send({status: 'succ', msg: "del post succ."});
				});
			} else {
				res.send({status: 'succ', msg: "del post succ."});
			}
		});
	} else{
		logger.error('wrong state: ' + req.body.state);
		return res.send({status: 'err', msg: 'wrong state'});
	}
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

var adminViewGet = function(req, res){
	if (req.session.auth !== true){
		return res.redirect("/user/login");
	}
	var renderObj = {};
	renderObj.authorName = req.session.username;

	var draftsQuery = Draft.find({author: req.session.userid}).sort('-postTime');
	var postsQuery = Post.find({author: req.session.userid}).sort('-postTime');
	
	draftsQuery.exec(function(err, drafts){
		var renderPosts = [];

		//all drafts
		for (var i=0; i<drafts.length; i++){
			drafts[i].urlWithDate = drafts[i].makeUrlWithDate();
			drafts[i].postDateString = drafts[i].postDateToString();
			drafts[i].category = drafts[i].categoryToString();
			drafts[i].stateString = '草稿';

			renderPosts.push(drafts[i]);
		}

		postsQuery.exec(function(err, posts){
			for (var i=0; i<posts.length; i++){
				//posts with no draft
				if (!posts[i].draftId){
					posts[i].urlWithDate = posts[i].makeUrlWithDate();
					posts[i].postDateString = posts[i].postDateToString();
					posts[i].category = posts[i].categoryToString();
					posts[i].stateString = '已发布';
					posts[i].state       = 'published';
					renderPosts.push(posts[i]);	
				}				
			}

			renderObj.posts = renderPosts;
			return res.render('templates/admin.jade', renderObj);
		});
	});
};

/* GET home page. */
router.get('/', postsAll);

/* view post */
router.get('/u/:userid', postsByUserCtrl);
router.get('/c/:category', postsByCategoryCtrl);
router.get(/^\/(\d{4})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/?$/, postsByDaterangeCtrl);
router.get(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([\w-]+)$/, postSingle);


/* post admin */
router.get('/admin', adminViewGet);

/* new post */
router.get('/new', newPostGet);
router.get('/new/:postid', newPostGet);

router.post('/new/delPost', delPost);
router.post('/new/upload', upload);
router.post('/new/delete', deleteImg);
router.post('/new/draft', newDraftCtrl);
router.post('/new', newPostCtrl);


module.exports = router;
