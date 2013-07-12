
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
    var email = state.email = $("#dialog form.create input.email").val();
    var password = state.password = $("#dialog form.create input[name='password']").val();
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


function validateEmail(email) {
  if (email.length < 3) return false;
  if (email.indexOf('@') === -1) return false;
  return true;
}

setupFunctions["reset-password"] = function() {
  $('#dialog form.reset').on('submit', function(e) {
    console.log('reset form!!!', e, this.email);
    var email = this.email.value;

    e.preventDefault();

    if (! email.length) {
      //$('.reset-password .error').html(errors.missing_email);
      return;
    }
    if (! validateEmail(email)) {
      return enterError('.reset-password', 'invalid_email');
    }

    // send code email
    send('reset_code', { email: email })
    .then(function (r) {
      //leaveError();
      if (r.success) {
        // switch to confirm code page
        state.email = email;
        switchTo('confirm-reset-code');
      } else {
        enterError('.reset-password', r.message);
      }
    });

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
      } else {
        enterError('.confirm-reset-code', r.message);
      }
    });

    e.preventDefault();
    return false;
  });
};

function validatePassword(pass) {
  if (pass.length < 8 || pass.length > 80) return false;
  return true;
}

setupFunctions["new-password"] = function() {
  $('#dialog form .passowrd').on('blur', function(e) {
    var password = this.value;
    if (! validatePassword(password)) {
      $(this).addClass('error').addClass('invalid');
    }
  });

  $('#dialog form .confirm_passowrd').on('blur', function(e) {
    var password = this.value;
    if (! validatePassword(password)) {
      $(this).addClass('oops').addClass('invalid');
    }
    if (password !== this.form.password.value) {
      $(this).addClass('oops').addClass('mismatch');
    }
  });

  $('#dialog form.new_password').on('submit', function(e) {
    var password = this.password.value;
    var confirm_password = this.confirm_password.value;

    if (! password.length) {
      $(this.password)
        .addClass('error')
        .addClass('missing')
        .attr('placeholder', 'Enter password here');

      return;
    }
    if (! confirm_password.length) {
      $(this.confirm_password)
        .addClass('error')
        .addClass('missing')
        .attr('placeholder', 'Repeat password here');
      return;
    }

    if (password !== confirm_password) return false;

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

  var devices = Object.keys(account.devices);
  $('ul.devices').html();
  if (devices.length) {
    devices.forEach(function(deviceId) {
      var device = account.devices[deviceId];
      $('ul.devices').append(
        $('<li>')
          .html(device.name.bold())
          .addClass(device.form)
          .addClass(device.syncing ? 'syncing' : 'notsyncing')
      );
    });
  } else {
  }

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

  $('#dialog').on('click', '.resend',
    function() {
      send('reverify', {
        email: state.email
      }).then(function(r) {
        if (r.success) {
        } else {
        }
      });
    });

  $("#dialog").on("click", '.signin', function() {
    switchTo('t1-create-signin');
    console.log($("x-tabbox"));
    $("x-tabbox")[0].setSelectedIndex(1);
  });

  $("#dialog").on("click", 'a.create, button.create', function() {
    switchTo('t1-create-signin');
    $("x-tabbox")[0].setSelectedIndex(0);
  });

});

