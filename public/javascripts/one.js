
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
    var creds = {
      email: state.email,
      password: state.password,
      password_confirm: password_confirm,
      landing: state.flow.verifyLanding,
      device: state.device,
      os: state.os
    };

    if (flow.verify === 'link') {
      send('create', creds)
        .then(function(r) {
          console.log('response', r);
          if (r.success) {
            switchTo("verify");
          } else {
            // show errors
          }
        });
    }

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

  function update(type, val) {
    $('#progress-message').html('Syncing your ' + type + '...');
  }

  // should take about 15 seconds on average
  var intv = setInterval(function () {
    progressMeter.value = val += 7 * Math.random();

    if (val >= 100) {
      $('#progress-message').html('Synced!');
      clearInterval(intv);
    } else if (val >= 80) {
      update('passwords', val);
    } else if (val >= 70) {
      update('tabs', val);
    } else if (val >= 40) {
      update('history', val);
    } else {
      update('bookmarks', val);
    }
  }, 600);

};

setupFunctions["verify"] = function() {
  $('#dialog .verify-email').html(state.email);
};


setupFunctions["reset-password"] = function() {
  $('#dialog form.reset').on('submit', function(e) {
    console.log('reset form!!!', e, this.email);
    var email = this.email.value;

    // send code email
    send('reset_code', { email: email })
    .then(function (r) {
      console.log('reset form return!!!', r);
      if (r.success) {
        // switch to confirm code page
        state.email = email;
        switchTo('confirm-reset-code');
      }
    });

    e.preventDefault();
    return false;
  });
};

setupFunctions["confirm-reset-code"] = function() {
  $('#dialog .email').html(state.email);

  $('#dialog form.reset_code').on('submit', function(e) {
    var code = this.code.value;
    console.log('confirm reset form!!!', e);

    // send code email
    send('confirm_reset_code', {
      email: state.email,
      code: code
    })
    .then(function (r) {
      console.log('reset back!', r);
      if (r.success) {
        // switch to confirm code page
        switchTo('new-password');
      }
    });

    e.preventDefault();
    return false;
  });
};

setupFunctions["new-password"] = function() {
  $('#dialog form.new_password').on('submit', function(e) {
    var password = this.password.value;
    var confirm_password = this.confirm_password.value;

    // send code email
    send('new_password', {
      email: state.email,
      password: password,
      confirm_password: confirm_password
    })
    .then(function (r) {
      if (r.success) {
        // switch to confirm code page
        switchTo('reset-success');
      }
    });

    e.preventDefault();
    return false;
  });
};

setupFunctions["reset-success"] = function() {
  var account = state.accounts[state.email];

  $('ul.devices').html();
  Object.keys(account.devices).forEach(function(deviceId) {
    var device = account.devices[deviceId];
    $('ul.devices').append(
      $('<li>')
        .html(device.name.bold())
        .addClass(device.form)
        .addClass(device.syncing ? 'syncing' : 'notsyncing')
    );
  });

};

setupFunctions["preferences"] = function() {
  $('#dialog .email').html(state.email);
  var account = state.accounts[state.email];

  console.log('devices', account.devices);

  $('ul.devices').html();
  Object.keys(account.devices).forEach(function(deviceId) {
    var device = account.devices[deviceId];
    $('ul.devices').append(
      $('<li>')
        .html(device.name.bold())
        .addClass(device.form)
        .addClass(device.syncing ? 'syncing' : 'notsyncing')
    );
  });

  $("button.logout").on("click", function() {
    var alert = document.createElement('x-alert');
    alert.innerHTML =
      '<h3>Firefox Account</h3><p>Sign out will disconnect the browser your account.' +
      '<p><small>You can also:<br/>' +
      '<a href="#" class="clear-data">Clear local data</a> or ' +
      '<a href="#" class="delete-account">Delete account</a>';

    alert.setAttribute('fade-duration', 500);
    alert.setAttribute('secondary-text', 'Cancel');
    alert.setAttribute('primary-text', 'Sign Out');
    //alert.setAttribute('active', null);
    document.body.appendChild(alert);

    alert.addEventListener('hide', function(e) {
      if (e.buttonType === 'primary') {
        send('logout').then(function(r) {
          if (r.success) {
            state.email = null;
            switchTo('preferences-signed-out');
          }
        });
      }
    });
  });

};

setupFunctions["preferences-signed-out"] = function() {
  console.log('state', state.email);

  $("button.signin").on("click", function() {
    switchTo('t1-create-signin');
    console.log($("x-tabbox"));
    $("x-tabbox")[0].setSelectedIndex(1);
  });

  $("button.create").on("click", function() {
    switchTo('t1-create-signin');
    $("x-tabbox")[0].setSelectedIndex(0);
  });
};

$(function() {
  console.log("starting");
  state.email = user;
  state.flow = flow;

  if (page) {
    send("accounts").then(function(accounts) {
      state.accounts = accounts;
      switchTo(page);
    });
  } else if (user && verified) {
    switchTo("t2-signed-in-page");
  } else {
    switchTo("t1-create-signin");
  }

  $("#notes-container").toggle();

  $("#dialog").on('click', 'a[data-page]', function(e) {
    var page = $(this).data('page');
    switchTo(page);
    e.preventDefault();
    return false;
  });
});

