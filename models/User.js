var mongoose = require('mongoose');
var hash= require('simple-hash');
var logger = require('tracer').colorConsole();

var Schema = mongoose.Schema;

/* user's name should be unique, there is logic to do unique check */
var userSchema = new Schema({
	name		: {type: String, required: true},
	hash		: {type: String, required: true},
	salt		: {type: String, required: true},

	email		: {type: String, required: true},
	registerTime: {type: Date, default: Date.now, required: true},
	group		: {type: String, enum: ['admin', 'not-admin'], default: 'not-admin'},
});

userSchema.statics.create = function(obj, cb){
	/* user'name unique check */
	this.findOne({name: obj.name}, function(err, user){
		if (user !== null){
			logger.info('user exist', obj);
			cb(new Error('user exist'));
			return;
		}
		hash.hash(obj.pass, function(err, salt, hash){
			if (err) {
				logger.error(err);
				cb(new Error('hash error'));
				return;
			}
			obj.salt = salt;
			obj.hash = hash;
			logger.debug('new user info', obj);
			var newUser = new User(obj);
			newUser.save(function(err){
				if (err) {
					logger.error(err);
					cb(new Error('new user save error'));
					return;
				}
				cb(null, {status: 'succ', msg: 'create user succ!'});
			});
		});
	});
};

userSchema.statics.auth = function (name, pass, cb) {
	this.findOne({name: name}, function(err, user){
		if (err){
			logger.error(err);
			return cb(err);
		}
		if (user === null){
			logger.debug('user dosenot exist', name);
			return cb(new Error("Username dose not exist!"));
		}
		hash.hash2(pass, user.salt, function(err, hash){
			if (hash === user.hash){
				cb(null, user._id);
			}
			else {
				cb(new Error("Password is incorrect !"));
			}
		});
	});
};

var User = mongoose.model('User', userSchema);

module.exports = User;
