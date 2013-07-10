
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
    password: "password",
    devices: {
      foo: {
        lastSync: Date.now(),
        name: deviceName('mac', 'desktop'),
        os: 'mac',
        form: 'desktop'
      }
    }
  }
};

function isVerified(user) {
  return accounts[user] && !accounts[user].token;
}

function flowParams(params, session) {
  return {
    // verify flow
    // - 'link' for verify link sent to email
    // - 'pin' for PIN sent to email
    verify: params.verify || session.verify || 'link',

    // This effects the landing page during link verify flow if
    // the user opens it in a different browser/client.
    // - 'verified' verifies the email but tells the user to login using firefox
    // - 'oops' gives an error and tells the user to open the link
    //   in firefox
    verifyLanding: params.verifyLanding || session.verifyLanding || 'verified'
  };
}

app.get('/',
  function(req, res) {
    res.render('index', {
      user: req.session.user,
      verified: isVerified(req.session.user),
      layout: false
    });
  });

app.get('/flow/:page?',
  function(req, res) {
    res.render('flow', {
      user: req.session.user,
      verified: isVerified(req.session.user),
      page: req.params.page,
      flow: flowParams(req.query, req.session)
    });
  });

app.all('/api/accounts',
  function(req, res) {
    res.json(accounts);
  });

function addUser(params) {
  accounts[params.email] = {
    password: params.password,
    devices: {
    }
  };

  accounts[params.email].devices[params.deviceId] = {
    lastSync: 0,
    name: deviceName(params.os, params.form),
    os: params.os,
    form: params.form
  };
}

function deviceName(os, form) {
  if (os === 'mac') {
    return 'MacBook';
  } else if (os === 'win') {
    return 'Windows' + (form === 'mobile' ? ' phone' : form);
  } else if (os === 'android') {
    return 'Android ' + (form === 'mobile' ? ' phone' : form);
  } else {
    return os.toUpperCase() + ' ' + form;
  }
}

app.post('/api/create',
  function(req, res) {
    var user = req.body.email;

    console.log('req body', req.body);

    if (accounts[user]) {
      res.json(400, { success: false, error: 'AccountExists' });
    } else {
      addUser(req.body);

      req.session.token = accounts[user].token = crypto.randomBytes(32).toString('hex');
      req.session.user = user;
      email.sendNewUserEmail(user, accounts[user].token, req.body.landing);

      console.log(accounts);

      res.json({ success: true });
    }
  });

app.post('/api/create_code',
  function(req, res) {
    var user = req.body.email;
    var pass = req.body.password;

    if (accounts[user]) {
      res.json(400, { success: false, error: 'AccountExists' });
    } else {
      addUser(req.body);

      req.session.confirm_code = accounts[user].confirm_code = Math.floor(Math.random() * 90000000) + 10000000;
      req.session.user = user;
      email.sendNewUserEmailCode(user, accounts[user].confirm_code);

      console.log(accounts);

      res.json({ success: true });
    }
  });

app.post('/api/reverify',
  function(req, res) {
    var user = req.body.email;
    if (!accounts[user]) {
      res.json(404, { success: false, message: "No such user" });
    } else if (!accounts[user].token) {
      res.json(404, { success: false, message: "No token found for this user" });
    }

    req.session.token = accounts[user].token;
    req.session.user = user;
    email.sendNewUserEmail(user, accounts[user].token);

    res.json({ success: true });
  });

app.post('/api/login',
  function(req, res) {
    var user = req.body.email;
    var pass = req.body.password;

    if (accounts[user] && accounts[user].password === pass) {
      req.session.user = user;
      res.json({ success: true });
    } else {
      res.json(401, { success: false, error: "Unauthorized" });
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

app.all('/confirm_email',
  function(req, res) {
    var email = req.query.email;
    var token = req.query.token;
    var landing = req.query.verifyLanding;

    console.log('landing', landing);

    if (!accounts[email]) {
      res.redirect('/flow');
    } else if (token !== req.session.token
      && token == accounts[email].token) {
      // user is not using the original Firefox browser
      delete req.session.token;
      if (landing !== 'oops') delete accounts[email].token;
      res.redirect('/flow/' + landing);
    } else if (token === accounts[email].token) {
      // account exists and user is using the same browser
      delete accounts[req.session.user].token;
      res.redirect('/flow');
    } else {
      res.json(400, { success: false, error: "BadToken" });
    }
  });

app.all('/api/confirm_email_code',
  function(req, res) {
    var email = req.body.email;
    var code = parseInt(req.body.code, 10);

    if (!accounts[email]) {
      res.json(404, { success: false, error: "UnknownAccount" });
    } else if (code === accounts[email].confirm_code) {
      delete accounts[email].confirm_code;
      res.json({ success: true });
    } else {
      res.json(400, { success: false, error: "BadCode" });
    }
  });

app.post('/api/reset_code',
  function(req, res) {
    var user = req.body.email;

    if (!accounts[user]) {
      return res.json(404, { success: false, message: "No such user: " + user });
    }

    accounts[user].reset_code = Math.floor(Math.random() * 90000000) + 10000000;
    email.sendResetEmail(user, accounts[user].reset_code);

    res.json({ success: true });
  });

app.all('/api/confirm_reset_code',
  function(req, res) {
    var email = req.body.email;
    var code = parseInt(req.body.code, 10);

    if (!accounts[email]) {
      res.json(404, { success: false, error: "UnknownAccount" });
    } else if (code === accounts[email].reset_code) {
      delete accounts[email].reset_code;
      res.json({ success: true });
    } else {
      res.json(400, { success: false, error: "BadCode" });
    }
  });

app.post('/api/new_password',
  function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var confirm_password = req.body.confirm_password;

    if (!accounts[email]) {
      res.json(404, { success: false, error: "UnknownAccount" });

    } else if (password != confirm_password) {
      res.json(400, { success: false, error: "PasswordMismatch" });

    } else if (password) {
      accounts[email].password = password;
      res.json({ success: true });
    } else {
      res.json(400, { success: false, error: "MissingPassword" });
    }
  });

http.createServer(app).listen(config.get('port'), config.get('host'), function(){
  console.log('Express server listening on port ' + config.get('port'));
});
