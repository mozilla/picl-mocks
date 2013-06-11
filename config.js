const convict = require('convict');

var config = convict({
  public_url: {
    format: 'url',
    default: 'http://localhost:3000/',
    ENV: 'PUBLIC_URL'
  },
  port: {
    format: 'port',
    default: 3000,
    ENV: 'PORT',
    arg: 'port'
  }
});

config.validate();

module.exports = config;
