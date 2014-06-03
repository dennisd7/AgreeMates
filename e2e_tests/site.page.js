'use strict';
// jshint maxlen: false
// jshint undef: false

var AgreeMatesHomepage = function() {
  this.welcome = element(by.id('user-welcome'));
  this.menu = element(by.id('side-menu'));
  this.menuItems = element.all(by.css('.nav li a'));

  this.get = function() {
    browser.get('http://localhost:3000');
  };

  this.clickLink = function(itemNum) {
    this.menuItems.get(itemNum).click();
  };
};

module.exports = new AgreeMatesHomepage();

