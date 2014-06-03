'use strict';
// jshint maxlen: false
// jshint undef: false

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('agreemates homepage', function() {
  var homepage = require('./site.page.js');

  beforeEach(function() {
    homepage.get();
  });

  it('greets logged in user', function() {
    expect(homepage.welcome.getText()).to.eventually.equal('Welcome, Aengus!');
  });

  it('has sidebar with nine links', function() {
    expect(homepage.menuItems.count()).to.eventually.equal(9);
  });

});
