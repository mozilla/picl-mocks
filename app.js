
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , expressLayouts = require('express-ejs-layouts')
  ;

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(expressLayouts);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var accounts = {
  known: {
    password: "password"
  }
};

app.get('/',
  function(req, res) {
    res.render('index', { user: req.session.user, layout: false });
  });

app.get('/flow',
  function(req, res) {
    res.render('flow', { user: req.session.user });
  });

app.all('/api/accounts',
  function(req, res) {
    res.json(accounts);
  });

app.post('/api/create',
  function(req, res) {
    console.log(req.body);
    var user = req.body.email;
    var pass = req.body.password;

    if (accounts[user]) {
      res.json({ success: false, error: 'AccountExists' });
    } else {
      accounts[user] = { password: pass };
      req.session.user = user;

      res.json({ success: true });
    }
  });

app.post('/api/login',
  function(req, res) {
    console.log(req.body);
    var user = req.body.email;
    var pass = req.body.password;

    if (accounts[user] && accounts[user].password === pass) {
      req.session.user = user;
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Unauthorized" });
    }
  });

app.post('/api/logout',
  function(req, res) {
    req.session.destroy(function() {
      res.json({ success: true });
    });
  });


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
