'use strict';
// jshint maxlen: false
// jshint undef: false

var BillsPage = function() {
  this.homepage = require('./site.page.js');
  this.resolvedButtons = element.all(by.css('.btn-group button'));
  this.addBillButton = element(by.css('.ng-scope .ng-scope button'));

  this.get = function() {
    this.homepage.get();
    this.homepage.clickLink(2);
  };
};

module.exports = new BillsPage();

