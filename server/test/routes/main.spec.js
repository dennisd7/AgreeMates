// Index back end unit tests

'use strict';

var main = require('../../routes/main');
var sinon = require('sinon');

describe('Main', function() {

  var res, resMock;

  beforeEach(function() {
    res = {render: function() {}};
    resMock = sinon.mock(res);
  });

  afterEach(function() {
    resMock.verify();
  });

  describe('getIndex', function() {

    it('should render login page if user is undefined', function() {
      var req = {};
      resMock.expects('render').once().withArgs('components/login/index');
      main.getIndex(req, res);
    });

    it('should render add apartment page if no apartment', function() {
      var req = {user: {attributes: {apartment_id: null}}};
      resMock.expects('render').once().withArgs('components/apartment/index');
      main.getIndex(req, res);
    });

    it('should use FB profile picture if facebook_id is defined', function() {
      var req = {user: {attributes: {apartment_id: 1, facebook_id: 1,
        first_name: 'first'}}};
      resMock.expects('render').once().withArgs('index', {firstname: 'first',
        profile_pic:
        'https://graph.facebook.com/1/picture?height=300&width=300'});
      main.getIndex(req, res);
    });

    it('should use placeholder image if IDs are undefined', function() {
      var req = {user: {attributes: {apartment_id: 1, facebook_id: null,
        google_id: null, first_name: 'first'}}};
      resMock.expects('render').once().withArgs('index', {firstname: 'first',
        profile_pic: 'img/default.png'});
      main.getIndex(req, res);
    });

  });

});
