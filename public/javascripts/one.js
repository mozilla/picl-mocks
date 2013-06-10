
setupFunctions["t1-create-signin"] = function() {

  $('#dialog form.login').on("submit", function(e) {
    state.email = $("#dialog form.login input.email").val();
    state.password = $("#dialog form.login input[name='password']").val();

    send('login', { email: state.email, password: state.password })
      .then(function(r) {
        console.log('response', r);
        if (r.success) {
          switchTo("t2-signed-in-page");
        } else {
          // show errors
        }
      });

    e.preventDefault();
    return false;
  });

  $('#dialog form.create').on("submit", function(e) {
    state.email = $("#dialog form.create input.email").val();
    state.password = $("#dialog form.create input[name='password']").val();
    var password_confirm = $("#dialog form.create input[name='password']").val();

    send('create', {
      email: state.email,
      password: state.password,
      password_confirm: password_confirm })
      .then(function(r) {
        console.log('response', r);
        if (r.success) {
          switchTo("t2-signed-in-page");
        } else {
          // show errors
        }
      });

    e.preventDefault();
    return false;
  });
};

setupFunctions["t2-signed-in-page"] = function() {
  console.log('state', state.email);

  $('#dialog .user').html(state.email);

  $("#dialog a.prefs").on("click", function() {
    switchTo("preferences");
  });

  /** Setup the <progress> JavaScript example **/
  var progressMeter = $('#progress-meter')[0];
  progressMeter.min = 0;
  progressMeter.max = 100;
  var val = 0;

  var intv = setInterval(function () {
    progressMeter.value = val += 8 * Math.random();
    if (val >= 100) {
      $('#progress-message').html('Synced!');
      clearInterval(intv);
    }
  }, 500);

};

setupFunctions["preferences"] = function() {
  console.log('state', state.email);

  $("a.logout").on("click", function() {
    send('logout').then(function(r) {
      window.location = '/';
    });
  });

};

$(function() {
  console.log("starting");
  if (user) {
    state.email = user;
    switchTo("t2-signed-in-page");
  } else {
    switchTo("t1-create-signin");
  }
  //window.setTimeout(function() {switchTo("t2-get-password");}, 5000);
});

console.log('WTF');
