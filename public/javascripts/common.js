
var currentlyShowing = null;

var state = {};

var setupFunctions = {};

state.device = navigator.userAgent.match('Mobile') ? 'mobile' :
               navigator.userAgent.match('Tablet') ? 'tablet' :
               'desktop';

state.os = navigator.userAgent.match('Mac') ? 'mac' :
           navigator.userAgent.match('Windows') ? 'win' :
           navigator.userAgent.match('Android') ? 'android' :
          'linux';

// each device has a unique id
state.deviceId = localStorage.getItem('deviceId');
if (! state.deviceId) {
  state.deviceId = guid();
  localStorage.setItem("deviceId", guid());
}


function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

var errors = {
  invalid_password: 'Password must be at least 8 characters',
  password_mismatch: 'These passwords don\'t match',
  enter_password: 'Please enter a password',
  enter_email: 'Please enter an email',
  repeat_password: 'Repeat password here',
  missing_email: 'Enter email here',
  invalid_email: 'Please use a valid email address',
  incorrect_password: 'Incorrect password. Please try again.',
  no_account: 'Try another email or <a href="#" class="create">Create an account</a>',
  incorrect_code: 'The code you entered is incorrect',
  expired_code: 'The code you entered has expired, <a href="#" class="resend">resend email</a>',
  unverified: 'You need to verify this email first. <a href="#" class="resend">Click here</a> to resend the verification link.',
  too_many: 'You\'ve entered the incorrect code too many times.',
  exists: 'There is an existing account for this email.<br/>Re-enter email or Sign In.'
};

function enterError(selector, message) {
  console.log('error!!', selector, message, errors[message]);
  $(selector).addClass('error');
  $(selector + ' .error').html(errors[message]);
}

function leaveError() {
  $('#dialog div.error, #dialog input.error').removeClass('error').removeClass('oops').removeClass('ok');
}

function send(verb, body) {
  if (!body) body = {};
  body.deviceId = state.deviceId;

  console.log('sending', verb, body);

  var d = $.Deferred();
  $.ajax({
    type: "POST",
    url: "/api/" + verb,
    // what we send:
    contentType: "application/json",
    data: JSON.stringify(body),
    // what we expect:
    dataType: "json",
    complete: function (j) { d.resolve(j.responseJSON); }
  });
  return d;
}

function generatePassword() {
  return "correct-horse-battery-staple";
}

function enterMeansClick(inputSelector, buttonSelector) {
  $(inputSelector).on("keyup", function(e) {
    if (e.keyCode == 13)
      $(buttonSelector).click();
    return false;
  });
}

function deleteAccount(name) {
  console.log('deleting', name);

  send('delete', {email: name}).then(refreshAccounts);
}

function refreshAccounts() {
  console.log('refreshing accounts');

  send("accounts").then(function(accounts) {
    state.accounts = accounts;
    console.log("accounts", accounts);
    $("#all-accounts").empty();
    var verifyLink;
    for (var name in accounts) {
      verifyLink = accounts[name].token ?
          (location.protocol + '//' + location.host +
          '/confirm_email?email=' + name +
          '&token=' + accounts[name].token +
          '&verifyLanding=' + state.flow.verifyLanding
          ) : '';
      // never do this in real code
      var s = ("<li>email: <b>"+name+"</b> / password: <b>"+
           accounts[name].password+"</b>" +
           " (<a href=\"javascript: deleteAccount('" + name + "');\">delete</a>)" +
           (verifyLink ? ' (<a href="'+verifyLink+'">verify link</a>)' : '') +
           (accounts[name].reset_code ? ' (reset: ' + accounts[name].reset_code + ')' : '') +
           (accounts[name].confirm_code ? ' (confirm: ' + accounts[name].confirm_code + ')' : '') +
           "</li>");
      $("#all-accounts").append($(s));
    };
  });
}

function switchTo(which) {
  console.log('switching to ', which);

  function done() {
    var notes = $("#templates .notes-"+which);
    if (notes.length) {
      $("#notes").empty().append(notes.clone());
    }
    refreshAccounts();
    var focus = $("#dialog .focus");
    if (focus.length == 1) {
      focus.focus();
    }
    currentlyShowing = which;
    console.log(which);
    var f = setupFunctions[which];
    if (f)
      f();
  }
  function add() {
    $("#dialog").empty();
    console.log("showing", which);
    var entry = $("#templates ."+which).clone();
    $("#dialog").append(entry).fadeIn("fast", done);
  }
  $("#sidechannel-container").hide().fadeOut("fast");
  $("#dialog").fadeOut("fast", add);
}

function showSidechannel(which) {
  var container = $("#sidechannel-container");
  container.empty();
  var template = $("#templates .side-"+which).clone();
  container.append(template);
  container.fadeIn("slow");
  return template;
}

function toggleAdmin() {
  $("#notes-container").toggle();
}

// konami code!
Mousetrap.bind('up up down down left right left right b a enter', toggleAdmin);
Mousetrap.bind('mod+e', toggleAdmin);
