'use strict';

var expect = chai.expect;

describe('bills module', function() {
  var users = {users: [
    {
      'id': 69, 
      'first_name': 'Sue', 
      'last_name': 'PerHot'
    },
	{
      'id': 88, 
      'first_name': 'Michael', 
      'last_name': 'Irvin'
    },
	{
      'id': 1, 
      'first_name': 'George', 
      'last_name': 'Washington'
    }]};
  
  var unresolvedBills = {bills: [
	{
		'id': 0,
    'name': 'water',
    'amount': 100,
    'creatorId': 69,
    'payTo': 'Sue',
		'payments': [
					{
						'userId': 69,
            'amount': 40,
						'paid' : true
					},
					{
						'userId': 88,
            'amount': 60,
						'paid' : false
					}]
	},
	{
		'id': 1,
    'name': 'rent',
    'amount': 300,
    'creatorId': 88,
    'payTo': 'Michael',
		'payments': [
					{
						'userId': 1,
            'amount': 100,
						'paid' : false
					},
					{
						'userId': 88,
            'amount': 50,
						'paid' : false
					},
          {
            'userId': 69,
            'amount': 150,
            'paid' : false
          }]
	}]};
	
	 var resolvedBills = {bills: [
	{
		'id': 3,
    'name': 'rent',
    'amount': 300,
    'creatorId': 88,
    'payTo': 'Michael',		
		'payments': [
					{
						'userId': 69,
						'amount': 150,
						'paid' : true
					},
					{
						'userId': 88,
						'amount': 150,
						'paid' : true
					}]
	},
	{
		'id': 4,
    'name': 'rent',
    'amount': 100,
    'creatorId': 88,
    'payTo': 'Michael',
		'payments': [
					{
						'userId': 1,
						'amount': 50,
						'paid' : true
					},
					{
						'userId': 88,
						'amount': 50,
						'paid' : true
					}]
	}]};
	
  var user = {
      'id': 69, 
      'first_name': 'Sue', 
      'last_name': 'PerHot'
    };

  var bill = {
  	'name': 'add1',
  	'total': 10,
  	'interval': 0,
  	'date': '06/01/14'
  }

  var responsible = [
  	{
  		'id': 69,
  		'amount': 5
  	},
  	{
  		'id': 1,
  		'amount': 5
  	},{
  		'id': 88,
  	}
  ];

  var selectedRoommates = [69, 1];

  var addBill = {
  	'name': 'add1',
  	'total': 10,
  	'interval': 0,
  	'date': '06/01/14',
  	'roommates': [
  		{
  			'id': 69,
  			'amount': 5
  		},
  		{
  			'id': 1,
  			'amount': 5
  		}
  	]
  };

  var updateBill = {
  	'id': 1,
    'name': 'updatedRent',
    'frequency': 0,
    'dueDate': '06/01/14',
    'amount': 200
  };

  var updatedAmount = [
		{
			'userId': 1,
      'amount': 100,
			'paid' : false
		},
		{
			'userId': 88,
      'amount': 50,
			'paid' : false
		},
    {
      'userId': 69,
      'amount': 50,
      'paid' : false
    }
  ];

  var tempBill = {
    'name': 'updatedRent',
    'interval': 0,
    'total': 200,
    'date': '06/01/14',
    'roommates': [
		{
			'id': 1,
      'amount': 100,
			'paid' : false
		},
		{
			'id': 88,
      'amount': 50,
			'paid' : false
		},
    {
      'id': 69,
      'amount': 50,
      'paid' : false
    }
    ]
  };

  var addResponse = {
  	'id': 5
  };
  
  var billsModule;
  beforeEach(function() {
    billsModule = module('main.bills');
  });

  it('should be registered', function() {
    expect(billsModule).not.to.equal(null);
  });

  describe('method', function() {
    var ctrl, scope, httpMock;

    beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
      httpMock = $httpBackend;

      scope = $rootScope.$new();

      ctrl = $controller;
      ctrl('BillsCtrl', {
        $scope: scope
      });
		  httpMock.whenGET('/user').respond(function(method, url, data, headers) {
				return [200,user];
		  });
		  httpMock.whenGET('/apartment/users').respond(function(method, url, data, headers) {
				return [200,users];
		  });
		  httpMock.whenPOST('/bills/', addBill).respond(function(method, url, data, headers) {
				return [200];
			});
		  httpMock.whenDELETE('/bills/0').respond();
		  httpMock.whenPUT('/bills/1', tempBill).respond(function(method, url, data, headers) {
				return [200];
			});
			httpMock.whenPUT('/bills/1/payment', {paid: true}).respond(function(method, url, data, headers) {
				return [200];
			});  
		  httpMock.whenGET('/bills?type=unresolved').respond(unresolvedBills);
		  httpMock.whenGET('/bills?type=resolved').respond(resolvedBills);
    }));

    afterEach(function() {
			httpMock.verifyNoOutstandingExpectation();
			httpMock.verifyNoOutstandingRequest();
    });	
	   
	describe('onload', function() {
		beforeEach(function() {
				httpMock.expectGET('/user').respond(user);
				httpMock.expectGET('/apartment/users').respond(users);
				httpMock.expectGET('/bills?type=unresolved').respond(unresolvedBills);
				httpMock.expectGET('/bills?type=resolved').respond(resolvedBills);
				httpMock.flush();		
			});
			
		describe('get user', function() {		
			it('should have correct id', function() {
				expect(scope.userId).to.equal(69);
			});
			it('should have correct first name', function() {
				expect(scope.userFirstName).to.equal('Sue');
			});
			it('should have correct last name', function() {
				expect(scope.userLastName).to.equal('PerHot');
			});
		});
		
		describe('get users',function() {
			it('should have logged in roomy', function() {
				expect(scope.roommates[0].id).to.equal(user.id);
				expect(scope.roommates[0].first_name).to.equal(user.first_name);
				expect(scope.roommates[0].last_name).to.equal(user.last_name);
				expect(scope.roommates[1].id).to.equal(users.users[1].id);
				expect(scope.roommates[1].first_name).to.equal(users.users[1].first_name);
				expect(scope.roommates[1].last_name).to.equal(users.users[1].last_name);
				expect(scope.roommates[2].id).to.equal(users.users[2].id);
				expect(scope.roommates[2].first_name).to.equal(users.users[2].first_name);
				expect(scope.roommates[2].last_name).to.equal(users.users[2].last_name);
			});
			it('should have correct length', function() {
				expect(scope.roommates.length).to.equal(3);
			});
		});
	
		describe('get resolved bills', function() {
			it('should have resolved set', function() {
			  expect(scope.resolvedBills.length).to.equal(resolvedBills.bills.length);
			  expect(scope.resolvedBills[0].id).to.equal(resolvedBills.bills[0].id);
			  expect(scope.resolvedBills[1].id).to.equal(resolvedBills.bills[1].id);
			});
			
			it('should have checkboxes set', function() {
        expect(scope.checkboxes.length).to.equal(2);
        expect(scope.checkboxes[0]).to.equal(0);
        expect(scope.checkboxes[1]).to.equal(3);
			});
		});
		
		describe('get unresolved bills', function() {
			it('should have unresolved set', function() {
			  expect(scope.unresolvedBills.length).to.equal(unresolvedBills.bills.length);
			  expect(scope.unresolvedBills[0].id).to.equal(unresolvedBills.bills[0].id);
			  expect(scope.unresolvedBills[1].id).to.equal(unresolvedBills.bills[1].id);
			});
			
			it('should have bills set', function() {
			  expect(scope.bills.length).to.equal(unresolvedBills.bills.length);
			  expect(scope.bills[0].id).to.equal(unresolvedBills.bills[0].id);
			  expect(scope.bills[1].id).to.equal(unresolvedBills.bills[1].id);
			});
			
			it('should have checkboxes set', function() {
        expect(scope.checkboxes.length).to.equal(2);
        expect(scope.checkboxes[0]).to.equal(0);
        expect(scope.checkboxes[1]).to.equal(3);
			});

		});
	
		describe('update balances', function() {
			beforeEach(function() {
				scope.updateBalanceModel();
			});
			it('should update balance model', function() {
				expect(scope.balances.length).to.equal(2);
				//Michael Irvin			  
        expect(scope.balances[0].userId).to.equal(88);
        expect(scope.balances[0].first_name).to.equal('Michael');
        expect(scope.balances[0].last_name).to.equal('Irvin');
        expect(scope.balances[0].owedToUser).to.equal(60);
        expect(scope.balances[0].userOwed).to.equal(150);
        expect(scope.balances[0].netBalance).to.equal(-90);

        //George Washington
        expect(scope.balances[1].userId).to.equal(1);
        expect(scope.balances[1].first_name).to.equal('George');
        expect(scope.balances[1].last_name).to.equal('Washington');
        expect(scope.balances[1].owedToUser).to.equal(0);
        expect(scope.balances[1].userOwed).to.equal(0);
        expect(scope.balances[1].netBalance).to.equal(0);
			});
		});
	
		describe('select resolved', function() {
			beforeEach(function() {
				scope.setTable('resolved');
			});
			it('should set table to unresolved', function() {
			  expect(scope.bills.length).to.equal(resolvedBills.bills.length);
			  expect(scope.bills[0].id).to.equal(resolvedBills.bills[0].id);
			  expect(scope.bills[1].id).to.equal(resolvedBills.bills[1].id);
			  expect(scope.table).to.equal('resolved');
			});
		});
		
		describe('select unrsolved', function() {
			beforeEach(function() {
				scope.setTable('unresolved');
			});
			it('should set table to unresolved', function() {
			  expect(scope.bills.length).to.equal(unresolvedBills.bills.length);
			  expect(scope.bills[0].id).to.equal(unresolvedBills.bills[0].id);
			  expect(scope.bills[1].id).to.equal(unresolvedBills.bills[1].id);
			  expect(scope.table).to.equal('unresolved');
			});
		});
		
		describe('add bill', function() {
			beforeEach(function() {
				httpMock.expectPOST('/bills/',addBill).respond(addResponse);
				scope.bill = bill; 
				scope.responsible = responsible;
				scope.selectedRoommates = selectedRoommates;
				scope.unresolvedBills = unresolvedBills.bills;
				scope.userId = 69;
				scope.addBillForm = {};
				scope.addBillForm.name = {};
				scope.addBillForm.amount = {};
				scope.addBillForm.date = {};
				scope.addBillForm.name.$dirty = false;
      	scope.addBillForm.amount.$dirty = false;
      	scope.addBillForm.date.$dirty = false;
      	scope.dismissAdd = function(){};
      	scope.dismissEdit = function(){};
				scope.addBill();
				httpMock.flush();				
			});				

			it('should add the bill to unresolvedBills', function() {
		  	expect(scope.unresolvedBills.length).to.equal(3);
			});		
		});
		
		describe('delete bill', function() {
			beforeEach(function() {
				httpMock.expectDELETE('/bills/0').respond();
				scope.bills = unresolvedBills.bills;
				scope.deleteId = 0;
				scope.deleteIdx = 0;
				scope.deleteBill();
				httpMock.flush();		
			});

			it('should delete the bill', function() {
			  expect(unresolvedBills.bills.length).to.equal(2);
			  expect(unresolvedBills.bills[0].id).to.equal(1);
			});		
		});
		
		describe('update bill', function() {
			beforeEach(function() {
				httpMock.expectPUT('/bills/1', tempBill).respond();
				scope.oldBill = updateBill;
				scope.selectedRoommates = [1, 69, 88];
				scope.updatedAmount = updatedAmount;
				scope.bills = unresolvedBills.bills;
				scope.updateIdx = 0;
				scope.addBillForm = {};
				scope.addBillForm.name = {};
				scope.addBillForm.amount = {};
				scope.addBillForm.date = {};
				scope.addBillForm.name.$dirty = false;
      	scope.addBillForm.amount.$dirty = false;
      	scope.addBillForm.date.$dirty = false;
      	scope.dismissAdd = function(){};
      	scope.dismissEdit = function(){};
      	scope.updateBill();
				httpMock.flush();
			});

			it('should update the bill', function() {
			  expect(scope.bills[0].id).to.equal(1);
			  expect(scope.bills[0].name).to.equal('updatedRent');
			  expect(scope.bills[0].amount).to.equal(200);
			  expect(scope.bills[0].payments[0].userId).to.equal(1);
			  expect(scope.bills[0].payments[0].amount).to.equal(100);
			  expect(scope.bills[0].payments[1].userId).to.equal(88);
			  expect(scope.bills[0].payments[1].amount).to.equal(50);
			  expect(scope.bills[0].payments[2].userId).to.equal(69);
			  expect(scope.bills[0].payments[2].amount).to.equal(50);
			});
		});
		
		describe('pay bill', function() {
			beforeEach(function() {
				httpMock.expectPUT('/bills/1/payment', {paid: "true"}).respond();
				scope.checkboxes = [],
				scope.bills = unresolvedBills.bills,
				scope.userId = 69,
				scope.payBill(1, 0),
				httpMock.flush();
			});

			it('should pay the bill', function() {
			  expect(scope.bills[0].payments[2].paid).to.equal(true);
			});
		});
	});
  });
});
