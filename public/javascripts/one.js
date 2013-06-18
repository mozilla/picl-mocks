
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
          switchTo("verify");
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

setupFunctions["verify"] = function() {
  $('#dialog .verify-email').html(state.email);
};

setupFunctions["preferences"] = function() {
  console.log('state', state.email);

  $("a.logout").on("click", function() {
    var alert = document.createElement('x-alert');
    alert.innerHTML = '<h3>PiCL Account</h3><p>Sign out will disconnect the browser with the current account. You can then sign in as another user.';
    alert.setAttribute('fade-duration', 500);
    alert.setAttribute('secondary-text', 'Cancel');
    alert.setAttribute('primary-text', 'Continue');
    //alert.setAttribute('active', null);
    document.body.appendChild(alert);
    console.log(alert);

    alert.addEventListener('hide', function(e) {
      if (e.buttonType === 'primary') {
        send('logout').then(function(r) {
          if (r.success) {
            window.location = '/';
          }
        });
      }
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

  $("#notes-container").toggle();
});

