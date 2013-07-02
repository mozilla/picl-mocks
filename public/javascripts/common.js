
var currentlyShowing = null;

var state = {};

var setupFunctions = {};

function send(verb, body) {
  if (!body) body = {};

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
    success: d.resolve
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
