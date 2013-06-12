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
    flowName: "flow",
    landing: 'verify_email_address',
    subject: 'Confirm email address for PiCL',
    text: fs.readFileSync(path.join(TEMPLATE_PATH, 'new.ejs')),
    html: fs.readFileSync(path.join(TEMPLATE_PATH, 'new.html.ejs'))
  }
};

// now turn file contents into compiled templates
Object.keys(templates).forEach(function(type) {
  templates[type].text = ejs.compile(templates[type].text.toString());
  if (templates[type].html) {
    templates[type].html = ejs.compile(templates[type].html.toString());
  }
});

function send(type, email, secret) {
  var template = templates[type];

  var public_url = config.get('public_url') + '/api/confirm_email';

  public_url += '?email=' + email;
  public_url += '&token=' + secret;
  public_url += '&flow=' + template.flowName;

  var templateArgs = {
    link: public_url
  };

  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: 'PiCL <no-reply@lcip.org>', // sender address
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

exports.sendNewUserEmail = function(email, secret) {
  send('new', email, secret);
};

