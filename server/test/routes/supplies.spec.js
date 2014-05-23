// Supplies back end unit tests
// jshint camelcase: false

'use strict';

var supplies = require('../../routes/supplies');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var succeedingStub = function(functionName, parameters) {
  return sinon.stub(supplies, functionName, function(id, thenFun) {
    thenFun(parameters);
  });
};

var failingStub = function(functionName, parameters) {
  return sinon.stub(supplies, functionName, function(id, thenFun, otherFun) {
    otherFun(parameters);
  });
};

var emptyStub = function(functionName) {
  return sinon.stub(supplies, functionName);
};

describe('Supplies', function() {

  var res, resMock;

  beforeEach(function() {
    res = {json: function() {}};
    resMock = sinon.mock(res);
  });

  afterEach(function() {
    resMock.verify();
  });

  describe('getSupplies', function() {

    it('should return 401 if user is not defined', function() {
      var req = {};
      resMock.expects('json').once().
        withArgs(401, {error: 'Unauthorized user.'});
      supplies.getSupplies(req, res);
    });

    it('queries for all supplies in the apartment', function() {
      var querySuppliesStub = emptyStub('querySupplies');
      var req = {user: {attributes: {apartment_id: 11}}};

      supplies.getSupplies(req, res);

      expect(querySuppliesStub).to.have.been.calledOnce;
      expect(querySuppliesStub).to.have.been.calledWith(11);

      querySuppliesStub.restore();
    });

    it('returns 503 if the supply query failed', function() {
      var querySuppliesStub = failingStub('querySupplies');
      var req = {user: {attributes: {apartment_id: 11}}};

      resMock.expects('json').once().
        withArgs(503, {error: 'Database error.'});

      supplies.getSupplies(req, res);

      querySuppliesStub.restore();
    });

    it('returns all supplies in the database', function() {
      var fakeSupplies = [
        {attributes: {id: 5, name: 'test supply numero uno', status: 1}},
        {attributes: {id: 2, name: 'test supply 2', status: 2}},
        {attributes: {id: 4, name: 'test supply 3', status: 1}}];
      var expectedJson = {supplies: [
                          {id: 5, name: 'test supply numero uno', status: 1},
                          {id: 2, name: 'test supply 2', status: 2},
                          {id: 4, name: 'test supply 3', status: 1}]};

      var querySuppliesStub = succeedingStub('querySupplies',
        {length: 3, models: fakeSupplies});
      var req = {user: {attributes: {apartment_id: 11}}};

      resMock.expects('json').once().
        withArgs(expectedJson);

      supplies.getSupplies(req, res);

      querySuppliesStub.restore();
    });
  });

  describe('addSupply', function() {

    it('should return 401 if user is not defined', function() {
      var req = {};
      resMock.expects('json').once().
        withArgs(401, {error: 'Unauthorized user.'});
      supplies.addSupply(req, res);
    });

    it('should return 400 if a supply name is invalid', function() {
      var req1 = {user: {attributes:
        {apartment_id: 1}}, body: {name: undefined}};
      var req2 = {user: {attributes:
        {apartment_id: 1}}, body: {name: null}};
      var req3 = {user: {attributes:
        {apartment_id: 1}}, body: {name: ''}};
      resMock.expects('json').thrice().
        withArgs(400, {error: 'Invalid supply name.'});
      supplies.addSupply(req1, res);
      supplies.addSupply(req2, res);
      supplies.addSupply(req3, res);
    });

    it('should return 400 if a supply status is invalid', function() {
      var req1 = {user: {attributes: {apartment_id: 1}}, body: {name: '1', status: -1}};
      var req2 = {user: {attributes: {apartment_id: 1}}, body: {name: '1', status: 'hello'}};
      var req3 = {user: {attributes: {apartment_id: 1}}, body: {name: '1', status: 3}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid supply status.'});
      supplies.addSupply(req1, res);
      supplies.addSupply(req2, res);
      supplies.addSupply(req3, res);
    });

  });

  describe('updateSupply', function() {

    it('should return 401 if user is not defined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      supplies.updateSupply(req, res);
    });

    it('should return 400 if a supply ID is invalid', function() {
      var req1 = {user: {attributes: {apartment_id: 1}}, params: {supply: 0.5}, body: {name: '1', status: 1}};
      var req2 = {user: {attributes: {apartment_id: 1}}, params: {supply: -1}, body: {name: '1', status: 1}};
      var req3 = {user: {attributes: {apartment_id: 1}}, params: {supply: 'hello'}, body: {name: '1', status: 1}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid supply ID.'});
      supplies.updateSupply(req1, res);
      supplies.updateSupply(req2, res);
      supplies.updateSupply(req3, res);
    });

    it('should return 400 if a supply name is invalid', function() {
      var req1 = {user: {attributes: {apartment_id: 1}}, params: {supply: 1}, body: {name: undefined}};
      var req2 = {user: {attributes: {apartment_id: 1}}, params: {supply: 1}, body: {name: null}};
      var req3 = {user: {attributes: {apartment_id: 1}}, params: {supply: 1}, body: {name: ''}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid supply name.'});
      supplies.updateSupply(req1, res);
      supplies.updateSupply(req2, res);
      supplies.updateSupply(req3, res);
    });

    it('should return 400 if a supply status is invalid', function() {
var req1 = {user: {attributes: {apartment_id: 1}}, params: {supply: 1}, body: {name: '1', status: -1}};
var req2 = {user: {attributes: {apartment_id: 1}}, params: {supply: 1}, body: {name: '1', status: 'hello'}};
var req3 = {user: {attributes: {apartment_id: 1}}, params: {supply: 1}, body: {name: '1', status: 3}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid supply status.'});
      supplies.updateSupply(req1, res);
      supplies.updateSupply(req2, res);
      supplies.updateSupply(req3, res);
    });

  });

  describe('deleteSupply', function() {

    it('should return 401 if user is not defined', function() {
      var req = {};
      resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
      supplies.deleteSupply(req, res);
    });

    it('should return 400 if a supply ID is invalid', function() {
      var req1 = {user: {attributes: {apartment_id: 1}}, params: {supply: 0.5}, body: {name: '1', status: 1}};
      var req2 = {user: {attributes: {apartment_id: 1}}, params: {supply: -1}, body: {name: '1', status: 1}};
      var req3 = {user: {attributes: {apartment_id: 1}}, params: {supply: 'hello'}, body: {name: '1', status: 1}};
      resMock.expects('json').thrice().withArgs(400, {error: 'Invalid supply ID.'});
      supplies.deleteSupply(req1, res);
      supplies.deleteSupply(req2, res);
      supplies.deleteSupply(req3, res);
    });

  });

});
