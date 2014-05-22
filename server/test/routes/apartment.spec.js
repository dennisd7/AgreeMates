// Apartment back end unit tests

'use strict';

var app = require('../../app');
var apartment = require('../../routes/apartment');
var sinon = require('sinon');

describe('Apartment', function() {

  var res, resMock;

  beforeEach(function() {
    res = {json: function() {}};
    resMock = sinon.mock(res);
  });

  afterEach(function() {
    resMock.verify();
  });

  describe('getApartment', function() {

    it('should return 401 if user is undefined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      apartment.getApartment(req, res);
    });
  });
  
  describe('getUsers', function() {

    it('should return 401 if user is undefined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      apartment.getUsers(req, res);
    });

  });

  describe('addApartment', function() {

    it('should return 401 if user is undefined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      apartment.addApartment(req, res);
    });

    it('should return 400 if the apartment name is invalid', function() {
      var req1 = {user: {attributes: {}}, body: {name: undefined}};
      var req2 = {user: {attributes: {}}, body: {name: null}};
      var req3 = {user: {attributes: {}}, body: {name: ''}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid apartment name.'});
      apartment.addApartment(req1, res);
      apartment.addApartment(req2, res);
      apartment.addApartment(req3, res);
    });

    it('should return 400 if the apartment address is invalid', function() {
      var req1 = {user: {attributes: {}}, body: {name: '1', address: undefined}};
      var req2 = {user: {attributes: {}}, body: {name: '1', address: null}};
	  var req3 = {user: {attributes: {}}, body: {name: '1', address: ""}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid apartment address.'});
      apartment.addApartment(req1, res);
      apartment.addApartment(req2, res);
      apartment.addApartment(req3, res);
    });
  });

  describe('updateApartment', function() {

    it('should return 401 if user is undefined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      apartment.updateApartment(req, res);
    });
	
	it('should return 400 if the apartment address is invalid', function() {
      var req1 = {user: {attributes: {}}, body: {name: '1', address: undefined}};
      var req2 = {user: {attributes: {}}, body: {name: '1', address: null}};
	  var req3 = {user: {attributes: {}}, body: {name: '1', address: ""}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid apartment address.'});
      apartment.updateApartment(req1, res);
      apartment.updateApartment(req2, res);
      apartment.updateApartment(req3, res);
    });
	
	it('should return 400 if the apartment name is invalid', function() {
      var req1 = {user: {attributes: {}}, body: {name: undefined}};
      var req2 = {user: {attributes: {}}, body: {name: null}};
      var req3 = {user: {attributes: {}}, body: {name: ''}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid apartment name.'});
      apartment.updateApartment(req1, res);
      apartment.updateApartment(req2, res);
      apartment.updateApartment(req3, res);
    });


  });


  describe('deleteApartment', function() {

    it('should return 401 if user is undefined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      apartment.deleteApartment(req, res);
    });
  });

});
