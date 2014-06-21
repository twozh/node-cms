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
