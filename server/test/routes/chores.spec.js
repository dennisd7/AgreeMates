//Chores back endtests

'user strict';

var Bookshelf = require('bookshelf');
Bookshelf.DB = Bookshelf.initialize({
  client: 'pg',
  connection: {}
});

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var chores = require('../../routes/chores');
var UserChoreModel = require('../../models/users_chores').model;
chai.use(sinonChai);

var succeedingStub = function(functionName, parameters) {
  return sinon.stub(chores, functionName, function(id, thenFun) {
    thenFun(parameters);
  });
};

var failingStub = function(functionName, parameters) {
  return sinon.stub(chores, functionName, function(id, thenFun, otherFun) {
    otherFun(parameters);
  });
};

var emptyStub = function(functionName) {
  return sinon.stub(chores, functionName);
};

var succeedDoubleStub = function(functionName, parameters){
	return sinon.stub(chores, functionName, function(param1,param2, thenFun, otherFun){
		thenFun(parameters);
	});
};

var failDoubleStub = function(functionName, parameters){
	return sinon.stub(chores, functionName, function(param1,param2, thenFun, otherFun){
		otherFun(parameters);
	});
};

var succeedTripleStub = function(functionName, parameters1, parameters2){
	return sinon.stub(chores, functionName, function(param1, param2, param3,thenFun, otherFun){
		thenFun(parameters1, parameters2);
	});
}
var failTripleStub = function(functionName, parameters){
	return sinon.stub(chores, functionName, function(param1, param2, param3,thenFun, otherFun){
		otherFun(parameters);
	});
}
describe('Chores', function(){
	describe('checkLogin', function(){

	var res, resMock;

	beforeEach(function(){
		res = {json: function(){}};
		resMock = sinon.mock(res);
	});

	afterEach(function(){
		resMock.verify();
	});

		it('should return 401 if user is undefined', function(){
			var req = {};
			resMock.expects('json').once().withArgs(401, {error: 'Unauthorized user.'});
			chores.checkLogin(req, res),function(){};
		});
	});

	describe('getChore', function(){
		var res, resMock;
		beforeEach(function(){
			res = {json: function(){}};
			resMock = sinon.mock(res);
		});

		afterEach(function(){
			resMock.verify();
		});

		it('fetches the chores', function(){
			var fetchChoresStub = emptyStub('fetchChores');
			var req1 = {user: {attributes:{apartment_id: 1}}};
			chores.getChores(req1, res);
			expect(fetchChoresStub).to.have.been.calledWith(1);
			fetchChoresStub.restore();
		});

		it('should fail with 503 Database error', function(){
			var fetchChoresStub = failingStub('fetchChores', null);
			var req1 = {user: {attributes:{apartment_id: 1}}};
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.getChores(req1, res);
			expect(fetchChoresStub).to.have.been.calledWith(1);
			fetchChoresStub.restore();
		});

		it('should return empty json if rows in empty', function(){
			var fetchChoresStub = succeedingStub('fetchChores', []);
			var req1 = {user: {attributes:{apartment_id: 1}}};
			resMock.expects('json').once().withArgs({chores: []});
			chores.getChores(req1, res);
			expect(fetchChoresStub).to.have.been.calledWith(1);
			fetchChoresStub.restore();
		});

		it('should return a chore with a users field', function(){
			var fetchChoresStub = succeedingStub('fetchChores', [{chore_id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																user_id: 4,
																first_name: 'Dave',
																last_name: 'Drisel',
																order_index: 0
																}]);
			var req1 = {user: {attributes:{apartment_id: 1}}};
			resMock.expects('json').once().withArgs({chores: [{id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																users: [{
																	user_id: 4,
																	first_name: 'Dave',
																	last_name: 'Drisel',
																	order_index: 0
																	}]}]});
			chores.getChores(req1, res);
			expect(fetchChoresStub).to.have.been.calledWith(1);
			fetchChoresStub.restore();
		});

		it('should merge users assigned to a chore together and return a chore with users field', function(){
			var fetchChoresStub = succeedingStub('fetchChores', [{chore_id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																user_id: 4,
																first_name: 'Dave',
																last_name: 'Drisel',
																order_index: 0
																},
																{chore_id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																user_id: 6,
																first_name: 'Sam',
																last_name: 'Biscut',
																order_index: 1
																}]);
			var req1 = {user: {attributes:{apartment_id: 1}}};
			resMock.expects('json').once().withArgs({chores: [{id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																users: [{
																	user_id: 4,
																	first_name: 'Dave',
																	last_name: 'Drisel',
																	order_index: 0
																	},
																	{
																	user_id: 6,
																	first_name: 'Sam',
																	last_name: 'Biscut',
																	order_index: 1
																	}]}]});
			chores.getChores(req1, res);
			expect(fetchChoresStub).to.have.been.calledWith(1);
			fetchChoresStub.restore();
		});

		it('should not merge chores with different ids together', function(){
			var fetchChoresStub = succeedingStub('fetchChores', [{chore_id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																user_id: 4,
																first_name: 'Dave',
																last_name: 'Drisel',
																order_index: 0
																},
																{chore_id: 2,
																name: 'Mocktest',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																user_id: 6,
																first_name: 'Sam',
																last_name: 'Biscut',
																order_index: 1
																}]);
			var req1 = {user: {attributes:{apartment_id: 1}}};
			resMock.expects('json').once().withArgs({chores: [{id: 1,
																name: 'test',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																users: [{
																	user_id: 4,
																	first_name: 'Dave',
																	last_name: 'Drisel',
																	order_index: 0
																	}]},
																{
																id: 2,
																name: 'Mocktest',
																createdate: '2016-05-08',
																duedate: '2016-09-09',
																interval: 3,
																completed: false,
																rotating: false,
																number_in_rotation: 1,
																users:[{
																	user_id: 6,
																	first_name: 'Sam',
																	last_name: 'Biscut',
																	order_index: 1
																}]
																}]});
			chores.getChores(req1, res);
			expect(fetchChoresStub).to.have.been.calledWith(1);
			fetchChoresStub.restore();
		});
	});

	describe('addChore', function() {

	var choreModel = {id: 3,
					attributes:{
					apartment_id: 1,
					id: 3,
					name: 'dishes',
					interval: 0,
					duedate: '2020-05-08',
					number_in_rotation: 1,
					rotating: true,
					completed: false
					},
					get: function(name){
						return 'dishes';
					}};

	var res, resMock;

	beforeEach(function(){
		res = {json: function(){}, send: function(){}};
		resMock = sinon.mock(res);
	});

	afterEach(function(){
		resMock.verify();
	});
		it('should return 400 if the chore name is invalid', function(){
			var req1 = {user: {attributes: {}}, body: {name: undefined, duedate: '2014-05-08'}};
			var req2 = {user: {attributes: {}}, body: {name: null, duedate: '2014-05-08'}};
			var req3 = {user: {attributes: {}}, body: {name: '', duedate: '2014-05-08'}};
			resMock.expects('json').thrice().withArgs(400, {error: 'Invalid chore name.'});
			chores.addChore(req1, res);
			chores.addChore(req2, res);
			chores.addChore(req3, res);
		});

		it('should return 400 if the interval is undefined or negative', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: undefined, duedate: '2014-05-08'}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', inverval: -1, duedate: '2014-05-08'}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid interval.'});
			chores.addChore(req1, res);
			chores.addChore(req2, res);
		});

		it('should return 400 if the due date is before the current date', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2014-05-08'}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2013-05-08'}};
			var req3 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2013-06-08'}};
			resMock.expects('json').thrice().withArgs(400, {error: 'Invalid due date.'});
			chores.addChore(req1, res);
			chores.addChore(req2, res);
			chores.addChore(req3, res);
		});

		it('should return 400 if the users assigned to the chore are invalid', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08'}};
			resMock.expects('json').once().withArgs(400, {error: 'Invalid users assigned to chore.'});
			chores.addChore(req1,res);
		});

		it('should return 400 if number_in_rotation is not an int', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: .5}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: undefined}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid number in chore rotation.'});
			chores.addChore(req1, res);
			chores.addChore(req2, res);
		});

		it('should return 400 if rotating chore and number_in_rotation less than zero', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1],number_in_rotation: 0, rotating: true}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1],number_in_rotation: -1, rotating: true}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid number assigned per week.'});
			chores.addChore(req1,res);
			chores.addChore(req2, res);
		});

		it('should return 503 if a database error occurs when creating the chore', function(){
			var req1 = {user: {attributes: {apartment_id: 1}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1],number_in_rotation: 1, rotating: true}};
			createChoreStub = failTripleStub('createChore',null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.addChore(req1,res);
			expect(createChoreStub).to.have.been.calledWith();
			createChoreStub.restore();
		});

		it('should return 503 if there was a problem saving users to the chore', function(){
			var req1 = {user: {attributes: {apartment_id: 1}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1,2],number_in_rotation: 1, rotating: true}};
			createChoreStub = succeedTripleStub('createChore',choreModel,[1]);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.addChore(req1,res);
			expect(createChoreStub).to.have.been.calledWith();
			createChoreStub.restore();
		});

		it('should return 503 if there was a problem saving the history of adding the chore', function(){
			var req1 = {user: {attributes: {apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1,2],number_in_rotation: 1, rotating: true}};
			createChoreStub = succeedTripleStub('createChore',choreModel,[1,2]);
			addHistoryStub = failDoubleStub('addHistory', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.addChore(req1,res);
			expect(createChoreStub).to.have.been.calledWith();
			expect(addHistoryStub).to.have.been.calledWith(choreModel, 'Gibbs Simon added chore dishes');
			createChoreStub.restore();
			addHistoryStub.restore();
		});

		it('should return 200 with the chore details and users', function(){
			var req1 = {user: {attributes: {apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1,2],number_in_rotation: 1, rotating: true}};
			createChoreStub = succeedTripleStub('createChore',choreModel,[1,2]);
			addHistoryStub = succeedDoubleStub('addHistory', null);
			resMock.expects('json').once().withArgs({chore: choreModel.attributes, users: [1,2]});
			chores.addChore(req1,res);
			expect(createChoreStub).to.have.been.calledWith();
			expect(addHistoryStub).to.have.been.calledWith(choreModel, 'Gibbs Simon added chore dishes');
			createChoreStub.restore();
			addHistoryStub.restore();
		});
	});

	describe('editChore',function(){

	var res, resMock;
	var newChore = {apartment_id: 1,
					id: 3,
					name: 'chore',
					interval: 0,
					duedate: new Date(2020,04,08),
					number_in_rotation: 1,
					rotating: true,
					completed: false};

	var choreModel = {id: 3,
					attribues:{
					apartment_id: 1,
					id: 3,
					name: 'chore',
					interval: 0,
					duedate: '2020-05-08',
					number_in_rotation: 1,
					rotating: true,
					completed: false
					},
					get: function(name){
						return 'dishes';
					}};
	beforeEach(function(){
		res = {json: function(){}, send: function(){}};
		resMock = sinon.mock(res);
	});

	afterEach(function(){
		resMock.verify();
	});

		it('should return 400 if the new chore duedate is invalid', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2014-05-08'},params: {chore: 3}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2013-05-08'},params: {chore: 3}};
			var req3 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2013-06-08'},params: {chore: 3}};
			resMock.expects('json').thrice().withArgs(400, {error: 'Invalid due date.'});
			chores.editChore(req1, res);
			chores.editChore(req2, res);
			chores.editChore(req3, res);

		});

		it('should return 400 if the chore name is invalid',function(){
			var req1 = {user: {attributes: {}}, body: {name: '', interval: 0, duedate: '2020-05-08'}, params: {chore: 3}};
			var req2 = {user: {attributes: {}}, body: {name: undefined, interval: 0, duedate: '2020-05-08'},params: {chore: 3}};
			var req3 = {user: {attributes: {}}, body: {name: null, interval: 0, duedate: '2020-05-08'},params: {chore: 3}};
			resMock.expects('json').thrice().withArgs(400,{error: 'Invalid chore name.'});
			chores.editChore(req1, res);
			chores.editChore(req2, res);
			chores.editChore(req3, res);
		});

		it('should return 400 if the interval is undefined or negative', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: undefined, duedate: '2020-05-08'}, params: {chore: 3}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', inverval: -1, duedate: '2020-05-08'}, params: {chore: 3}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid interval.'});
			chores.editChore(req1, res);
			chores.editChore(req2, res);
		});

		it('should return 400 if the roommates are invalid', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08'},params: {chore: 3}};
			resMock.expects('json').once().withArgs(400, {error: 'Invalid users assigned to chore.'});
			chores.editChore(req1,res);
		});

		it('should return 400 if number_in_rotation is not an int', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: .5},params: {chore: 3}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: undefined},params: {chore: 3}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid number in chore rotation.'});
			chores.editChore(req1, res);
			chores.editChore(req2, res);
		});

		it('should return 400 if rotating chore and number_in_rotation less than zero', function(){
			var req1 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1],number_in_rotation: 0, rotating: true},params: {chore: 3}};
			var req2 = {user: {attributes: {}}, body: {name: 'test', interval: 0, duedate: '2020-05-08', roommates: [1],number_in_rotation: -1, rotating: true},params: {chore: 3}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid number assigned per week.'});
			chores.editChore(req1,res);
			chores.editChore(req2, res);
		});

		it('should return 503 if there is a database error when creating the chore', function(){
			var req1 = {user:{attributes:{apartment: 1}}, body: {name: 'chore', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: 1, rotating: true},params: {chore: 3}};
			patchChoreStub = failingStub('patchChore', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.editChore(req1, res);
			expect(patchChoreStub).to.have.been.calledWith();
			patchChoreStub.restore();
		});

		it('should return 503 if there is a database error when unassigning users to the chore', function(){
			var req1 = {user:{attributes:{apartment_id: 1}}, body: {name: 'chore', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: 1, rotating: true},params: {chore: 3}};
			patchChoreStub = succeedingStub('patchChore', choreModel);
			unassignUsersStub = failingStub('unassignUsers', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.editChore(req1, res);
			expect(patchChoreStub).to.have.been.calledWith();
			expect(unassignUsersStub).to.have.been.calledWith(3);
			patchChoreStub.restore();
			unassignUsersStub.restore();
		});

		it('should return 503 if there is a database error when assigning users to the chore', function(){
			var req1 = {user:{attributes:{apartment_id: 1}}, body: {name: 'chore', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: 1, rotating: true},params: {chore: 3}};
			patchChoreStub = succeedingStub('patchChore', choreModel);
			unassignUsersStub = succeedingStub('unassignUsers', null);
			assignUsersStub = failingStub('assignUsers',null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.editChore(req1, res);
			expect(patchChoreStub).to.have.been.calledWith();
			expect(unassignUsersStub).to.have.been.calledWith(3);
			expect(assignUsersStub).to.have.been.calledWith();
			patchChoreStub.restore();
			unassignUsersStub.restore();
			assignUsersStub.restore();
		});

		it('should return 503 if there is a database error when recording history', function(){
			var req1 = {user:{attributes:{apartment_id: 1}}, body: {name: 'chore', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: 1, rotating: true},params: {chore: 3}};
			patchChoreStub = succeedingStub('patchChore', choreModel);
			unassignUsersStub = succeedingStub('unassignUsers', null);
			assignUsersStub = succeedingStub('assignUsers',[1]);
			addHistoryStub = failDoubleStub('addHistory', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.editChore(req1, res);
			expect(patchChoreStub).to.have.been.calledWith(newChore);
			expect(unassignUsersStub).to.have.been.calledWith(3);
			expect(assignUsersStub).to.have.been.calledWith();
			expect(addHistoryStub).to.have.been.calledWith();
			patchChoreStub.restore();
			unassignUsersStub.restore();
			assignUsersStub.restore();
			addHistoryStub.restore();
		});

		it('should send 200 if the chore has been editted and history logged', function(){
			var req1 = {user:{attributes:{apartment_id: 1}}, body: {name: 'chore', interval: 0, duedate: '2020-05-08', roommates: [1], number_in_rotation: 1, rotating: true},params: {chore: 3}};
			patchChoreStub = succeedingStub('patchChore', choreModel);
			unassignUsersStub = succeedingStub('unassignUsers', null);
			assignUsersStub = succeedingStub('assignUsers',[1]);
			addHistoryStub = succeedDoubleStub('addHistory', null);
			resMock.expects('send').once().withArgs(200);
			chores.editChore(req1, res);
			expect(patchChoreStub).to.have.been.calledWith(newChore);
			expect(unassignUsersStub).to.have.been.calledWith(3);
			expect(assignUsersStub).to.have.been.calledWith();
			expect(addHistoryStub).to.have.been.calledWith(choreModel);
			patchChoreStub.restore();
			unassignUsersStub.restore();
			assignUsersStub.restore();
			addHistoryStub.restore();
		});
	});

	describe('completeChore',function(){
		var res, resMock;

		var choreModel = {id: 3,
						attributes:{
						apartment_id: 1,
						id: 3,
						name: 'dishes',
						interval: 0,
						duedate: '2020-05-08',
						number_in_rotation: 1,
						rotating: true,
						completed: false
						},
						get: function(type){
							if(type == 'name'){
								return 'dishes';
							}else if(type == 'completed'){
								return false;
							}else if(type == 'duedate'){
								return new Date(2020,5,8);
							}else if(type == 'createdate'){
								return new Date(2011,4,6);
							}else if(type == 'number_in_rotation'){
								return 1;
							}else if(type == 'interval'){
								return 7;
							}else if(type == 'rotating'){
								return true;
							}else if(type == 'apartment_id'){
								return 1;
							}
						}
		};
		beforeEach(function(){
			res = {json: function(){}, send: function(){}};
			resMock = sinon.mock(res);
		});

		afterEach(function(){
			resMock.verify();
		});

		it('should return 400 if the chore id is invalid', function(){
			var req1 = {body: {apartment_id: 1, id: -3, user_id: 10}};
			var req2 = {body: {apartment_id: 1, id: 2.5, user_id: 10}};
			resMock.expects('json').twice().withArgs(400,{error: 'Invalid chore ID.'});
			chores.completeChore(req1,res);
			chores.completeChore(req2,res);
		});

		it('should return 503 if database error in fetching the chore', function(){
			var req1 = {body: {apartment_id: 1, id: 2, user_id: 10}};
			fetchChoreStub = failDoubleStub('fetchChore', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			fetchChoreStub.restore();
		});

		it('should return 400 if the chore is already complete', function(){
			var req1 = {body: {apartment_id: 1, id: 2, user_id: 10}};
			var chore = {
				get: function(type){
					if(type == 'completed'){
						return true;
					}else{
						return false;
					}
				}
			};
			fetchChoreStub = succeedDoubleStub('fetchChore', chore);
			resMock.expects('json').once().withArgs(400, {error: 'Chore is already complete.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			fetchChoreStub.restore();
		});

		it('should return 503 if there is an error marking the chore complete', function(){
			var req1 = {body: {apartment_id: 1, id: 2, user_id: 10}};
			var chore = {
				get: function(type){
					if(type == 'completed'){
						return false;
					}else if(type == 'interval'){
						return 0;
					}else if(type == 'name'){
						return 'dishes';
					}else{
						return undefined;
					}
				}
			};
			fetchChoreStub = succeedDoubleStub('fetchChore', chore);
			markChoreCompleteStub = failingStub('markChoreComplete',null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
		});

		it('should return 503 if there is an error creating history when marking chore complete of one shot', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			var chore = {id: 3,
					attributes:{
					apartment_id: 1,
					id: 3,
					name: 'dishes',
					interval: 0,
					duedate: '2020-05-08',
					number_in_rotation: 1,
					rotating: true,
					completed: false
					},
				get: function(type){
					if(type == 'completed'){
						return false;
					}else if(type == 'interval'){
						return 0;
					}else if(type == 'name'){
						return 'dishes';
					}else{
						return undefined;
					}
				}
			};
			fetchChoreStub = succeedDoubleStub('fetchChore', chore);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			addHistoryStub = failDoubleStub('addHistory', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(addHistoryStub).to.have.been.calledWith(chore, 'Gibbs Simon completed chore dishes');
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			addHistoryStub.restore();
		});

		it('should return 200 if the chore complete of one shot is successful', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			var chore = {
				get: function(type){
					if(type == 'completed'){
						return false;
					}else if(type == 'interval'){
						return 0;
					}else if(type == 'name'){
						return 'dishes';
					}else{
						return undefined;
					}
				}
			};
			fetchChoreStub = succeedDoubleStub('fetchChore', chore);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			addHistoryStub = succeedDoubleStub('addHistory', null);
			resMock.expects('send').once().withArgs(200);
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(addHistoryStub).to.have.been.calledWith(chore, 'Gibbs Simon completed chore dishes');
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			addHistoryStub.restore();
		});

		it('should return 503 if there is a database error when trying to complete a reoccuring chore', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			fetchAssignedUsersStub = failingStub('fetchAssignedUsers', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(fetchAssignedUsersStub).to.have.been.calledWith(choreModel);
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			addHistoryStub.restore();
			fetchAssignedUsersStub.restore();
		});

		it('should return 503 if there is a database error when trying to complete a reoccuring chore', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			var user_chore = [{
				order_index: 0,
				user_id: 10
			}];
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			fetchAssignedUsersStub = succeedingStub('fetchAssignedUsers', user_chore);
			createChoreStub = failTripleStub('createChore',null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(fetchAssignedUsersStub).to.have.been.calledWith(choreModel);
			expect(createChoreStub).to.have.been.calledWith();
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			fetchAssignedUsersStub.restore();
			createChoreStub.restore();
		});

		//Need to add
		it('should return 503 if there is a database error when trying to create the next instance of a reoccurring chore', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			var user_chore = [{
				order_index: 0,
				user_id: 10
			}];
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			fetchAssignedUsersStub = succeedingStub('fetchAssignedUsers', user_chore);
			createChoreStub = succeedTripleStub('createChore',choreModel,[1,2]);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(fetchAssignedUsersStub).to.have.been.calledWith(choreModel);
			expect(createChoreStub).to.have.been.calledWith();
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			fetchAssignedUsersStub.restore();
			createChoreStub.restore();
		});

		it('should return 503 if there is a database error when trying to create the history of marking chore complete', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			var user_chore = [{
				order_index: 0,
				user_id: 10
			}];
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			fetchAssignedUsersStub = succeedingStub('fetchAssignedUsers', user_chore);
			createChoreStub = succeedTripleStub('createChore',choreModel,[10]);
			addHistoryStub = failDoubleStub('addHistory', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(fetchAssignedUsersStub).to.have.been.calledWith(choreModel);
			expect(createChoreStub).to.have.been.calledWith();
			expect(addHistoryStub).to.have.been.calledWith(choreModel, 'Gibbs Simon completed chore dishes');
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			fetchAssignedUsersStub.restore();
			createChoreStub.restore();
			addHistoryStub.restore();
		});

		it('should return 200 and the new instance of the chore if marking chore complete and making the history were successful', function(){
			var req1 = {user: {attributes:{apartment_id: 1, first_name: 'Gibbs', last_name: 'Simon'}},body: {apartment_id: 1, id: 2, user_id: 10}};
			var user_chore = [{
				order_index: 0,
				user_id: 10
			}];
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			markChoreCompleteStub = succeedingStub('markChoreComplete',null);
			fetchAssignedUsersStub = succeedingStub('fetchAssignedUsers', user_chore);
			createChoreStub = succeedTripleStub('createChore',choreModel,[10]);
			addHistoryStub = succeedDoubleStub('addHistory', null);
			resMock.expects('json').once().withArgs({chore: choreModel.attributes, users: [10]});
			chores.completeChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1,2);
			expect(markChoreCompleteStub).to.have.been.calledWith(2);
			expect(fetchAssignedUsersStub).to.have.been.calledWith(choreModel);
			expect(createChoreStub).to.have.been.calledWith();
			expect(addHistoryStub).to.have.been.calledWith(choreModel, 'Gibbs Simon completed chore dishes');
			fetchChoreStub.restore();
			markChoreCompleteStub.restore();
			fetchAssignedUsersStub.restore();
			createChoreStub.restore();
			addHistoryStub.restore();
		});
	});

	describe('deleteChore', function(){
		var res, resMock;

		beforeEach(function(){
			res = {json: function(){}, send: function() {} };
			resMock = sinon.mock(res);
		});

		afterEach(function(){
			resMock.verify();
		});

		it('should return 400 if chore id is invalid', function(){
			var req1 = {user: {attributes: {apartment_id: 1}}, params:{chore: -1}};
			var req2 = {user: {attributes: {apartment_id: 1}}, params:{chore: undefined}};
			resMock.expects('json').twice().withArgs(400, {error: 'Invalid chore ID.'});
			chores.deleteChore(req1,res);
			chores.deleteChore(req2,res);
		});

		it('should return 503 if database error in fetching chore', function(){
			var req1 = {user: {attributes: {apartment_id: 1}}, params:{chore: 4}};
			fetchChoreStub = failDoubleStub('fetchChore', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.deleteChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1);
			fetchChoreStub.restore();
		});



		it('should return 503 if database error when unassigning ', function(){
			var req1 = {user: {attributes: {apartment_id: 1}}, params:{chore: 4}};
			fetchChoreStub = succeedDoubleStub('fetchChore', 4);
			unassignUsersStub = failingStub('unassignUsers', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.deleteChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1);
			expect(unassignUsersStub).to.have.been.calledWith(4);
			fetchChoreStub.restore();
			unassignUsersStub.restore();
		});

		it('should return 503 if database error when removing the chore model itself', function(){
			var req1 = {user: {attributes: {apartment_id: 1}}, params:{chore: 4}};
			fetchChoreStub = succeedDoubleStub('fetchChore', null);
			unassignUsersStub = succeedingStub('unassignUsers', null);
			removeChoreStub = failDoubleStub('removeChore', null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.deleteChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1);
			expect(unassignUsersStub).to.have.been.calledWith(4);
			expect(removeChoreStub).to.have.been.calledWith(1,4);
			fetchChoreStub.restore();
			unassignUsersStub.restore();
			removeChoreStub.restore();
		});

		it('should return 200 if chore is removed and history recorded properly', function(){
			var req1 = {user: {attributes: {first_name: 'Greg', last_name: 'Knickels',apartment_id: 1}}, params:{chore: 4}};
			var choreModel = {get: function(name){
												return 'dishes';
										}};
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			unassignUsersStub = succeedingStub('unassignUsers', null);
			removeChoreStub = succeedDoubleStub('removeChore', null);
			addHistoryStub = failDoubleStub('addHistory',null);
			resMock.expects('json').once().withArgs(503, {error: 'Database error.'});
			chores.deleteChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1);
			expect(unassignUsersStub).to.have.been.calledWith(4);
			expect(removeChoreStub).to.have.been.calledWith(1,4);
			expect(addHistoryStub).to.have.been.calledWith(choreModel,'Greg Knickels deleted chore dishes');
			fetchChoreStub.restore();
			unassignUsersStub.restore();
			addHistoryStub.restore();
			removeChoreStub.restore();
		});

		it('should return 200 if chore is removed and history recorded properly', function(){
			var req1 = {user: {attributes: {first_name: 'Greg', last_name: 'Knickels',apartment_id: 1}}, params:{chore: 4}};
			var choreModel = {get: function(name){
												return 'dishes';
										}};
			fetchChoreStub = succeedDoubleStub('fetchChore', choreModel);
			unassignUsersStub = succeedingStub('unassignUsers', null);
			removeChoreStub = succeedDoubleStub('removeChore', null);
			addHistoryStub = succeedDoubleStub('addHistory',null);
			resMock.expects('send').once().withArgs(200);
			chores.deleteChore(req1,res);
			expect(fetchChoreStub).to.have.been.calledWith(1);
			expect(unassignUsersStub).to.have.been.calledWith(4);
			expect(removeChoreStub).to.have.been.calledWith(1,4);
			expect(addHistoryStub).to.have.been.calledWith(choreModel,'Greg Knickels deleted chore dishes');
			fetchChoreStub.restore();
			unassignUsersStub.restore();
			removeChoreStub.restore();
			addHistoryStub.restore();
		});
	});
});
