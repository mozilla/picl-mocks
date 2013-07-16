
setupFunctions["t1-create-signin"] = function() {
  $('#dialog form input.email').on('blur', function(e) {
    var email = this.value;
    $(this).removeClass('oops').removeClass('invalid').removeClass('missing');
    if (! validateEmail(email)) {
      return $(this).addClass('oops').addClass('invalid');
    }
    $(this).addClass('ok');
  });

  $('#dialog form input.password').on('blur', function(e) {
    console.log(e);
    var password = this.value;
    $(this).removeClass('oops').removeClass('invalid').removeClass('missing');

    if (! validatePassword(password)) {
      return $(this).addClass('oops').addClass('invalid');
    }
    $(this).addClass('ok');
  });

  $('#dialog form input.confirm_password').on('blur', function(e) {
    var password = this.value;
    $(this)
      .removeClass('oops')
      .removeClass('mismatch')
      .removeClass('missing_confirm')
      .removeClass('invalid');
    if (! validatePassword(password)) {
      return $(this).addClass('oops').addClass('invalid');
    }
    if (password !== this.form.password.value) {
      return $(this).addClass('oops').addClass('mismatch');
    }
    $(this).addClass('ok');
  });

  $('#dialog form.login').on("submit", function(e) {
    leaveError();
    e.preventDefault();
    var email = state.email = $("#dialog form.login input.email").val();
    var password = state.password = $("#dialog form.login input[name='password']").val();
    var error = false;

    if (! email.length) {
      $(this.email)
        .addClass('error')
        .addClass('oops')
        .addClass('missing');

      error = true;
    }

    if (! password.length) {
      $(this.password)
        .addClass('error')
        .addClass('oops')
        .addClass('missing');

      error = true;
    }

    if (error) return false;

    send('login', { email: state.email, password: state.password })
      .then(function(r) {
        console.log('response', r);
        if (r.success) {
          switchTo("t2-signed-in-page");
        } else {
          // show errors
          enterError('.login-panel', r.message);
        }
      });

    return false;
  });

  $('#dialog form.create').on("submit", function(e) {
    var email = state.email = $("#dialog form.create input.email").val();
    var password = state.password = $("#dialog form.create input[name='password']").val();
    var password_confirm = $("#dialog form.create input[name='password_confirm']").val();
    var error = false;

    e.preventDefault();
    leaveError();

    console.log('passes', email, password, password_confirm);

    if (! email.length) {
      $(this.email)
        .addClass('error')
        .addClass('oops')
        .addClass('missing');
      error = true;
    }

    if (! password.length) {
      $(this.password)
        .addClass('error')
        .addClass('oops')
        .addClass('missing');
      error = true;
    }
    if (! password_confirm.length) {
      $(this.password_confirm)
        .addClass('error')
        .addClass('oops')
        .addClass('missing_confirm');
      error = true;
    }

    if (error || password !== password_confirm) return false;

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
            enterError('.create-panel', r.message);
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

  // show devices

  send('accounts')
  .then(function (r) {
    var account = state.accounts[state.email];

    console.log('devices', account.devices);

    $('#dialog ul.devices').html();
    Object.keys(account.devices).forEach(function(deviceId) {
      var device = account.devices[deviceId];
      $('#dialog ul.devices').append(
        $('<li>')
          .addClass(device.form)
          //.html(device.name.bold())
          //.addClass(device.syncing ? 'syncing' : 'notsyncing')
      );
    });

  });

  // show progress meter
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

  console.log('state', state);

  var intv = setInterval(function () {
    send('verified', { email: state.email })
    .then(function (r) {
      console.log('verify!!!', r);
      if (r.success) {
        switchTo('t2-signed-in-page');
        clearInterval(intv);
      }
    });
  }, 1000);
};


function validateEmail(email) {
  if (!email.length) return true;
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
      return enterError('.reset-password', 'enter_password');
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
  if (pass.length && pass.length < 8) return false;
  return true;
}

setupFunctions["new-password"] = function() {
  $('#dialog form input.password').on('blur', function(e) {
    console.log(e);
    var password = this.value;
    $(this).removeClass('oops').removeClass('invalid')
    .removeClass('missing');
    if (! validatePassword(password)) {
      return $(this).addClass('oops').addClass('invalid');
    }
    $(this).addClass('ok');
  });

  $('#dialog form input.confirm_password').on('blur', function(e) {
    var password = this.value;
    $(this)
      .removeClass('oops')
      .removeClass('mismatch')
      .removeClass('missing_confirm')
      .removeClass('invalid');
    if (! validatePassword(password)) {
      return $(this).addClass('oops').addClass('invalid');
    }
    if (password !== this.form.password.value) {
      return $(this).addClass('oops').addClass('mismatch');
    }
    $(this).addClass('ok');
  });

  $('#dialog form.new_password').on('submit', function(e) {
    e.preventDefault();
    leaveError();
    var error = false;

    var password = this.password.value;
    var confirm_password = this.confirm_password.value;

    if (! password.length) {
      $(this.password)
        .addClass('error')
        .addClass('oops')
        .addClass('missing');

      error = true;
    }

    if (! confirm_password.length) {
      $(this.confirm_password)
        .addClass('error')
        .addClass('oops')
        .addClass('missing_confirm');
      error = true;
    }

    if (error || password !== confirm_password) return false;

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
  $('#dialog ul.devices').html();
  if (devices.length) {
    devices.forEach(function(deviceId) {
      var device = account.devices[deviceId];
      $('#dialog ul.devices').append(
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

  $('#dialog ul.devices').html();
  Object.keys(account.devices).forEach(function(deviceId) {
    console.log('device??', deviceId);
    var device = account.devices[deviceId];
    if (!device) return;
    $('#dialog ul.devices').append(
      $('<li>')
        .html(device.name.bold())
        .addClass(device.form)
        .attr('data-did', deviceId)
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
    switchTo("preferences");
  } else {
    switchTo("t1-create-signin");
  }

  //$("#notes-container").toggle();

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

