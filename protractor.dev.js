// An example configuration file.
exports.config = {
  // The address of a running selenium server.
  seleniumAddress: 'http://localhost:4444/wd/hub',

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },

  // Spec patterns are relative to the current working directly when
  // protractor is called.
  specs: ['e2e_tests/**/*.js'],

  framework: 'mocha',

  // Options to be passed to mocha.
  mochaOpts: {
    reporter: 'list'
  },

  baseUrl: 'http://localhost:3000',

  onPrepare: function() {
    browser.driver.get('http://localhost:3000');
    browser.driver.findElement(by.css('.ion-social-facebook')).click();
    browser.driver.findElement(by.id('email')).sendKeys('');
    browser.driver.findElement(by.id('pass')).sendKeys('');
    browser.driver.findElement(by.id('u_0_1')).click();
  }
};
