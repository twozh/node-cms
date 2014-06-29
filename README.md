node-cms
========

CMS with node, based on the best practice

## components based on
* [expressjs](http://expressjs.com/)
* [mongoose](http://mongoosejs.com/)
* [bootstrap](http://getbootstrap.com/)

## features
* CMS based on expressjs, mongoose, mongodb, bootstrap
* User authentication and session
* Markdown editor based on markdown to html javascript library
* Post with image
* Admin system

## how I make this project
### prepare
* Ubuntu 12.04LTS with node, mongodb
* Install globle express generator `npm install -g express-generator`. Then run `express node-cms` to create the express project. Install mongoose, `npm install mongoose --save`. Install tracer, a logger system for debug,  `npm install tracer`. Init bower.json by `bower init`, install jquery and bootstrap with `bower install bootstrap --save`

### main procedure
* Install [express-session](https://github.com/expressjs/session) with `npm isntall epxress-session --save`.
Edit app.js, add `var session = require('express-session');` and `app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 6000000 }}));`

#### livereload
* Serverjs live restart when any js file change. Install nodemon, `npm install -g nodemon`. Run express with `nodemon bin/www`
* Srowser live refresh when any file change. Check [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch), or check Gruntfile.js in this project
