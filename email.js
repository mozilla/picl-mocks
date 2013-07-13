const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const nodemailer = require('nodemailer');
const config = require('./config');

const TEMPLATE_PATH = path.join(__dirname, "views", "emails");

var transport;

if (config.has('smtp.host')) {
  var options = config.get('smtp');

  // create reusable transport method (opens pool of SMTP connections)
  transport = nodemailer.createTransport('SMTP', {
    host: options.host,
    port: options.port,
    //secureConnection: true, // use SSL
    auth: {
      user: options.user,
      pass: options.pass
    }
  });
} else {
  transport = nodemailer.createTransport('sendmail');
}

// a map of all the different emails we send
const templates = {
  "new": {
    landing: 'confirm_email',
    subject: 'Confirm email address for Firefox Sync',
    text: fs.readFileSync(path.join(TEMPLATE_PATH, 'new.ejs')),
    html: fs.readFileSync(path.join(TEMPLATE_PATH, 'new.html.ejs'))
  },
  "reset": {
    landing: 'confirm_password',
    subject: 'Reset password for Firefox Sync',
    text: fs.readFileSync(path.join(TEMPLATE_PATH, 'reset.ejs')),
    html: fs.readFileSync(path.join(TEMPLATE_PATH, 'reset.html.ejs'))
  }
};

// now turn file contents into compiled templates
Object.keys(templates).forEach(function(type) {
  templates[type].text = ejs.compile(templates[type].text.toString());
  if (templates[type].html) {
    templates[type].html = ejs.compile(templates[type].html.toString());
  }
});

function send(type, email, secret, params) {
  var template = templates[type];

  var public_url = config.get('public_url') + '/' + template.landing;
  var report_link = config.get('public_url') + '/report';

  public_url += '?email=' + email + (params || '');

  var templateArgs = {
    link: public_url,
    report_link: report_link,
    secret: secret
  };

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: 'Firefox Sync <no-reply@lcip.org>', // sender address
    to: email, // list of receivers
    subject: template.subject, // Subject line
    text: template.text(templateArgs) // plaintext body
  };

  if (template.html) {
    mailOptions.html = template.html(templateArgs) // html body
  }

  // send mail with defined transport object
  transport.sendMail(mailOptions, function(err, res) {
    if (err) {
      console.log(err);
    } else {
      console.log('Message sent: ' + res.message);
    }
  });
}

exports.sendNewUserEmail = function(email, secret, landFlow) {
  var params = '&token=' + secret + '&verifyLanding=' + landFlow;
  send('new', email, secret, params);
};

exports.sendResetEmail = function(email, code) {
  send('reset', email, code);
};

