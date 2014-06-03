// An example configuration file.
exports.config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome',
    'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
    'build': process.env.TRAVIS_BUILD_NUMBER,
    'name': 'AgreeMates Protractor Tests'
  },

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['e2e_tests/**/*.js'],

  framework: 'mocha',

  mochaOpts: {
    reporter: 'list'
  },

  baseUrl: 'http://localhost:3000',

  onPrepare: function() {
    browser.driver.get('http://localhost:3000');
    browser.driver.findElement(by.css('.ion-social-facebook')).click();
    browser.driver.findElement(by.id('email')).sendKeys(process.env.FB_TEST_EMAIL);
    browser.driver.findElement(by.id('pass')).sendKeys(process.env.FB_TEST_PASS);
    browser.driver.findElement(by.id('u_0_1')).click();
  }
};
