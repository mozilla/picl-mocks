const convict = require('convict');

var config = convict({
  public_url: {
    format: 'url',
    default: 'http://localhost:3000',
    env: 'PUBLIC_URL'
  },
  host: {
    doc: "The ip address the server should bind",
    default: '127.0.0.1',
    format: 'ipaddress',
    env: 'IP_ADDRESS'
  },
  port: {
    format: 'port',
    default: 3000,
    env: 'PORT',
    arg: 'port'
  }
});

// handle configuration files.  you can specify a CSV list of configuration
// files to process, which will be overlayed in order, in the CONFIG_FILES
// environment variable
if (process.env.CONFIG_FILES) {
  var files = process.env.CONFIG_FILES.split(',');
  config.loadFile(files);
}

// debugging
console.log(process.env.PUBLIC_URL);

config.validate();

console.log(config.toString());

module.exports = config;
