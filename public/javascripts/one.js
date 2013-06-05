
setupFunctions["t1-create-signin"] = function() {
  var form = $('#dialog *[selected=true] form');
  console.log(form);
  var verb = form[0].className;
  form.on("submit", function(e) {
    state.email = $("#dialog *[selected=true] input.email").val();
    state.password = $("#dialog *[selected=true] input[name='password']").val();
    console.log("clicked", state);
    send(verb, { email: state.email, password: state.password })
      .then(function(r) {
        console.log(r);
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

};

$(function() {
  console.log("starting");
  switchTo("t1-create-signin");
  //window.setTimeout(function() {switchTo("t2-get-password");}, 5000);
});

console.log('WTF');
