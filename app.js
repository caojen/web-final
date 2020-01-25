
/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  user = require('./routes/user'),
  comment = require('./routes/comment');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
app.get('/user/login', routes.login);
app.get('/user/register', routes.register);

// JSON API

app.post('/user/login', user.login);
app.post('/user/logout', user.logout);
app.post('/user/register', user.register);

app.get('/api/posts', api.posts);
app.get('/api/post/:id', api.post);
app.put('/api/post/:id', api.editPost);
app.delete('/api/post/:id', api.deletePost);
app.post('/api/post', api.addPost);
app.put('/api/hidepost/:id', api.hidePost);

// Comment API
// the url's id = blog id

app.put('/api/comment/:id', comment.addComment);
app.put('/api/comment/hide/:id/:commentid', comment.changeCommentStatus);
app.get('/api/comment/:id/:commentid', comment.getChangeCommentPageDetail);
app.post('/api/comment/:id/:commentid', comment.changeComment);
app.delete('/api/comment/:id/:commentid', comment.deleteComment);

app.get('/api/comments/:id', comment.getComment);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Start server

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
