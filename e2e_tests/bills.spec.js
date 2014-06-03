'use strict';
// jshint maxlen: false
// jshint undef: false

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('bills', function() {
  var billsPage = require('./bills.page.js');
  beforeEach(function() {
    billsPage.get();
  });

  it('shows resolved buttons', function() {
    expect(billsPage.resolvedButtons.get(0).getText()).to.eventually.equal('Unresolved');
    expect(billsPage.resolvedButtons.get(1).getText()).to.eventually.equal('Resolved');
  });

  it('shows add bill button', function() {
    expect(billsPage.addBillButton.getText()).to.eventually.equal('Add Bill');
  });

  it('shows empty bills alert', function() {
  });
});
