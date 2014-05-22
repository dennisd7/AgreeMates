//Chores back endtests

'user strict';

var app = require('../../app');
var chores = require('../../routes/chores');
var sinon = require('sinon');

describe('Chores', function(){

	var res, resMock;
	
	beforeEach(function(){
		res = {json: function(){}};
		resMock = sinon.mock(res);
	});

	afterEach(function(){
		resMock.verify();
	});
	
	describe('checkLogin', function(){
		
		it('should return 401 if user is undefined', function(){
			var req = {};
			resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
			chores.checkLogin(req, res),function(){};
		});
	});
});