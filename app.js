
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , crypto = require('crypto')
  , path = require('path')
  , email = require('./email')
  , config = require('./config')
  , expressLayouts = require('express-ejs-layouts')
  ;

var app = express();

// all environments
app.set('port', config.get('port'));
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

function isVerified(user) {
  return accounts[user] && !accounts[user].token;
}

app.get('/',
  function(req, res) {
    res.render('index', {
      user: req.session.user,
      verified: isVerified(req.session.user),
      layout: false
    });
  });

app.get('/flow',
  function(req, res) {
    res.render('flow', {
      user: req.session.user,
      verified: isVerified(req.session.user)
    });
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
      req.session.token = accounts[user].token = crypto.randomBytes(32).toString('hex');
      req.session.user = user;
      email.sendNewUserEmail(user, accounts[user].token);

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

app.post('/api/delete',
  function(req, res) {
    var user = req.body.email;
    delete accounts[user];
    if (req.session.user == user) {
      req.session.destroy(function() {
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

app.all('/api/confirm_email',
  function(req, res) {
    var email = req.query.email;
    var token = req.query.token;

    if (!accounts[email]) {
      res.json({ success: false, error: "UnknownAccount" });
    } else if (token !== req.session.token) {
      delete req.session.user;
      delete req.session.token;
      // the user will be displayed the create account/sign in page
      res.redirect('/flow');
    } else if (token === accounts[email].token) {
      // account exists and user is using the same browser
      delete accounts[req.session.user].token;
      res.redirect('/flow');
    }
  });


http.createServer(app).listen(config.get('port'), config.get('host'), function(){
  console.log('Express server listening on port ' + config.get('port'));
});
