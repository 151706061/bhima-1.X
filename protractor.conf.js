/* global by,browser,element */

var q = require('q');

// we want to make sure we run tests locally, but TravisCI
// should run tests on it's own driver.  To find out if it
// is Travis loading the configuration, we parse the
// process.env.TRAVIS_BUILD_NUMBER and reconfigure for travis
// as appropriate.

var config = {
  
  // With paths not defined protractor will look in the local node_modules selenium folder for utilities
  // seleniumServerJar : './node_modules/protractor/selenium/selenium-server-standalone-2.45.0.jar',
  // chromeDriver      : './node_modules/protractor/selenium/chromedriver',
  seleniumPort      : 4444,

  specs: ['client/test/e2e/**/*.spec.js'],

  framework : 'mocha',
  baseUrl : 'https://localhost:8080/',
  allScriptsTimeout : 30000,

  // default browsers to run
  multiCapabilities: [{
    //'browserName': 'firefox',
 // }, {
    'browserName': 'chrome',
  }],

  // this will log the user in to begin with
  onPrepare : function () {
    return q.fcall(function () {
      browser.get('https://localhost:8080/#/login');

      element(by.model('LoginCtrl.credentials.username')).sendKeys('superuser');
      element(by.model('LoginCtrl.credentials.password')).sendKeys('superuser');
      element(by.id('submit')).click();

      // NOTE - you may need to play with the delay time to get this to work properly
      // Give this plenty of time to run
    }).delay(3100);
  }
};

// configuration for running on SauceLabs via Travis
if (process.env.TRAVIS_BUILD_NUMBER) {

  // SauceLabs credentials
  config.sauceUser = process.env.SAUCE_USERNAME;
  config.sauceKey = process.env.SAUCE_ACCESS_KEY;

  // modify the browsers to use Travis identifiers
  config.multiCapabilities = [{
    'browserName': 'firefox',
     'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
     'build': process.env.TRAVIS_BUILD_NUMBER,
  }, {
    'browserName': 'chrome',
     'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
     'build': process.env.TRAVIS_BUILD_NUMBER,
  }];
}

// expose to the outside world
exports.config = config;
