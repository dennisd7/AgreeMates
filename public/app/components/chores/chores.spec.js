'use strict';
// jshint maxlen: false

var expect = chai.expect;

describe('chores module', function () {
  //fake users
  var users = {
    users: [{
      'id': 3,
      'first_name': 'Dennis',
      'last_name': 'Ding'
    }, {
      'id': 6,
      'first_name': 'alice',
      'last_name': 'dole'
    }, {
      'id': 5,
      'first_name': 'bob',
      'last_name': 'dole'
    }]
  };

  //fake user
  var user = {
    'id': 3,
    'first_name': 'Dennis',
    'last_name': 'Ding'
  };

  //fake chores
  var chores = {
    chores: [{
      completed: true,
      createdate: '2014-05-23T18:16:23.236Z',
      duedate: '2014-07-19T07:00:00.000Z',
      id: 65,
      interval: 7,
      name: 'Garbage',
      number_in_rotation: 1,
      rotating: true,
      users: [{
        first_name: 'alice',
        last_name: 'dole',
        order_index: 1,
        user_id: 6
      }]
    }, {
      completed: false,
      createdate: '2014-05-23T22:55:08.125Z',
      duedate: '2014-05-31T07:00:00.000Z',
      id: 71,
      interval: 7,
      name: 'dishes',
      number_in_rotation: 2,
      rotating: false,
      users: [{
        first_name: 'Dennis',
        last_name: 'Ding',
        order_index: 1,
        user_id: 3
      }, {
        first_name: 'bob',
        last_name: 'dole',
        order_index: 0,
        user_id: 5
      }]
    }],
    users: ''
  };

  var new_chore = {
    apartment_id: 2,
    duedate: '2014-06-31',
    interval: 0,
    name: 'vacuum',
    number_in_rotation: 1,
    rotating: false,
    completed: false,
    userId: 3,
    roommates: [3]
  };

  var edit_chore = {
    apartment_id: 2,
    duedate: '2014-07-15',
    interval: 7,
    name: 'vacuum',
    number_in_rotation: 1,
    rotation_number: 1,
    rotating: true,
    completed: false,
    userId: 3,
    roommates: [3, 5],
    id: 80
  };

  var editChoreResponse = {};

  var addChoreResponse = {
    chore: {
      apartment_id: 2,
      completed: false,
      createdate: '2014-05-23T23:39:01.878Z',
      duedate: '2014-05-24T07:00:00.000Z',
      id: 80,
      interval: 0,
      name: 'vacuum',
      number_in_rotation: 1,
      reocurring_id: 0,
      rotating: false,
      user_id: 3
    },
    users: [{
      first_name: 'Dennis',
      last_name: 'Ding',
      order_index: 0,
      user_id: 3
    }]
  };

  var apartment = {
    id: 2,
    name: 'home',
    address: '123 lane st'
  };

  var deleteChoreResponse = {};

  var choresModule;

  beforeEach(function () {
    choresModule = module('main.chores');
  });

  it('should be registered', function () {
    expect(choresModule).not.to.equal(null);
  });

  describe('ChoresCtrl', function () {
    var ctrl, scope, httpMock;

    beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
      httpMock = $httpBackend;

      scope = $rootScope.$new();

      ctrl = $controller;

      ctrl('ChoresCtrl', {
        $scope: scope
      });

      httpMock.whenGET('/chores').respond(function () {
        return [200, chores];
      });

      httpMock.whenGET('/user').respond(function () {
        return [200, user];
      });

      httpMock.whenGET('/apartment').respond(function () {
        return [200, apartment];
      });

      httpMock.whenGET('/apartment/users').respond(function () {
        return [200, users];
      });

      httpMock.whenPOST('/chores', new_chore).respond(function () {
        return [200, addChoreResponse];
      });

      httpMock.whenPUT('/chores/:chore', edit_chore).respond(function () {
        return [200, editChoreResponse];
      });
      httpMock.whenDELETE('/chores/:chore', 0).respond(function () {
        return [200, deleteChoreResponse];
      });

    }));

    afterEach(function () {
      httpMock.verifyNoOutstandingExpectation();
      httpMock.verifyNoOutstandingRequest();
    });

    describe('onload', function () {
      beforeEach(function () {
        httpMock.expectGET('/user').respond(user);
        httpMock.expectGET('/chores').respond(chores);
        httpMock.expectGET('/apartment/users').respond(users);
        httpMock.expectGET('/apartment').respond(apartment);
        httpMock.flush();
      });

      describe('get user', function () {
        it('should have correct id', function () {
          expect(scope.userId).to.equal(3);
        });
        it('should have correct first name', function () {
          expect(scope.userFirstName).to.equal('Dennis');
        });
        it('should have correct last name', function () {
          expect(scope.userLastName).to.equal('Ding');
        });
      });


      describe('get chores', function () {
        it('should fetch all uncompleted chores', function () {
          expect(scope.chores_uncompleted.length).to.equal(1);
        });
      });

      describe('get chores', function () {
        it('should fetch all completed chores', function () {
          expect(scope.chores.length).to.equal(1);
        });
      });
      //end http tests

      describe('add', function () {
        beforeEach(function () {
          httpMock.expectPOST('/chores', new_chore).respond(addChoreResponse);
          scope.chore = new_chore;
          scope.responsibleList.push(users.users[0]);
          scope.addChore();
          httpMock.flush();
        });

        it('responsibleList should be length 1', function () {
          expect(scope.responsibleList.length).to.equal(1);
        });

        it('should display success', function () {
          expect(scope.success).to.equal(true);
        });

        it('should display success message', function () {
          expect(scope.successmsg).to.equal('Chore vacuum successfully added!');
        });
        it('should increase the uncompleted chores by 1', function () {
          expect(scope.chores_uncompleted.length).to.equal(2);
        });

        it('should have the same name', function () {
          expect(scope.chores_uncompleted[1].name).to.equal('vacuum');
        });

        it('should have one user responsible', function () {
          expect(scope.chores_uncompleted[1].users.length).to.equal(1);
        });

        it('should have no rotating', function () {
          expect(scope.chores_uncompleted[1].rotating).to.equal(false);
        });
      });
      //end add tests

      describe('update', function () {
        beforeEach(function () {
          httpMock.expectPUT('/chores/' + 80, edit_chore).respond(editChoreResponse);
          scope.chore = edit_chore;
          scope.chores = scope.chores_uncompleted;

          scope.responsibleList = [];
          scope.responsibleList.push(users.users[0]);
          scope.responsibleList.push(users.users[1]);
          scope.gindex = 1;
          scope.editChore(1);
          httpMock.flush();
        });

        it('should display success', function () {
          expect(scope.success).to.equal(true);
        });

        it('should display success message', function () {
          expect(scope.successmsg).to.equal('Chore vacuum successfully edited!');
        });

        it('should update to rotating', function () {
          expect(scope.chores[1].rotating).to.equal(true);
        });

        it('should update the interval', function () {
          expect(scope.chores[1].interval).to.equal(7);
        });

        it('should update the number in rotation', function () {
          expect(scope.chores[1].number_in_rotation).to.equal(1);
        });

      }); //end put test
      
      describe('update', function () {
        beforeEach(function () {
          httpMock.expectDELETE('/chores/71').respond(deleteChoreResponse);
          scope.prepareDelete(71, 0);
          scope.deleteChore();
          httpMock.flush();
        });

        it('should display success message',function() {
          expect(scope.successmsg).to.equal('Chore dishes successfully deleted!');
        });

        it('should change chores to be 0',function() {
          expect(scope.chores.length).to.equal(0);
        });

        it('should change chores uncompleted to be 0',function() {
          expect(scope.chores_uncompleted.length).to.equal(0);
        });

        it('should leave chores completed to be 1',function() {
          expect(scope.chores_completed.length).to.equal(1);
        });

      });


      it('should exist', function () {
        expect(ctrl).not.to.equal(null);
      });

    });
  });
});



