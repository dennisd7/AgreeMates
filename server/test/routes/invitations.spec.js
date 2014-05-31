// jshint camelcase: false
// jshint maxlen: false
'use strict';

var Bookshelf = require('bookshelf');
Bookshelf.DB = Bookshelf.initialize({
  client: 'pg',
  connection: {}
});

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var Hashids = require('hashids');
var hashids = new Hashids(process.env.INVITE_SALT, 8);

var invitations = require('../../routes/invitations');

var succeedingStub = function(functionName, parameters) {
  return sinon.stub(invitations, functionName, function(id, thenFun) {
    thenFun(parameters);
  });
};

var failingStub = function(functionName, parameters) {
  return sinon.stub(invitations, functionName, function(id, thenFun, otherFun) {
    otherFun(parameters);
  });
};

var emptyStub = function(functionName) {
  return sinon.stub(invitations, functionName);
};

describe('Invitations', function() {
  describe('addInvitations', function() {
    var res;
    var resMock;
    var createInvitationStub;

    beforeEach(function() {
      res = { json: function() {} };
      resMock = sinon.mock(res);
      createInvitationStub = sinon.stub(invitations, 'createInvitation',
        function(apartmentId, email) {
          return {apartment_id: apartmentId, email: email};
        });
    });

    afterEach(function() {
      resMock.verify();
      createInvitationStub.restore();
    });

    it('returns 400 if no user', function() {
      var req = {body: 'blah'};
      resMock.expects('json').once().
        withArgs(400, {error: 'Missing user or body'});

      invitations.addInvitations(req, res);
    });

    it('returns 400 if no body', function() {
      var req = {user: 'Some User'};
      resMock.expects('json').once().
        withArgs(400, {error: 'Missing user or body'});

      invitations.addInvitations(req, res);
    });

    it('returns 404 if no user id', function() {
      var req = {body: 'blah', user: {attributes: {}}};
      resMock.expects('json').once().
        withArgs(404, {error: 'could not fetch id'});

      invitations.addInvitations(req, res);
    });

    it('fetches the apartment if request is correct', function() {
      var fetchApartmentStub = emptyStub('fetchApartment');
      var req = {body: {emails: []}, user: {attributes: {apartment_id: 1}}};

      invitations.addInvitations(req, res);

      expect(fetchApartmentStub).to.have.been.calledWith(1);
      fetchApartmentStub.restore();
    });

    it('creates and saves all invitations if apartment is found', function() {
      var fetchApartmentStub = succeedingStub('fetchApartment',
                                    {attributes: {name: 'test apartment'}});
      var saveInvitationsStub = emptyStub('saveInvitations');

      var req = {body: {emails: ['test1@example.com', 'test2@example.com']},
                 user: {attributes: {apartment_id: 1}}};

      invitations.addInvitations(req, res);

      expect(createInvitationStub).to.have.been.calledTwice;
      expect(createInvitationStub).to.have.been.
        calledWith(1, 'test1@example.com');
      expect(createInvitationStub).to.have.been.
        calledWith(1, 'test2@example.com');
      expect(saveInvitationsStub).to.have.been.calledOnce;
      expect(saveInvitationsStub).to.have.been.
        calledWith([{apartment_id: 1, email: 'test1@example.com'},
                    {apartment_id: 1, email: 'test2@example.com'}]);

      fetchApartmentStub.restore();
      saveInvitationsStub.restore();
    });

    it('returns 503 if failed to save all invitations', function() {
      var fetchApartmentStub = succeedingStub('fetchApartment',
                                  {attributes: {name: 'test apartment'}});
      var saveInvitationsStub = sinon.stub(invitations, 'saveInvitations',
        function(invitations, responseFunction) {
          var resp = []; // no saved invitations
          responseFunction(resp);
        });

      var req = {body: {emails: ['test1@example.com', 'test2@example.com']},
                 user: {attributes: {apartment_id: 1}}};

      resMock.expects('json').once().
        withArgs(503, {error: 'Error creating invitations'});

      invitations.addInvitations(req, res);

      fetchApartmentStub.restore();
      saveInvitationsStub.restore();
    });

    it('should log the invitation send to the history', function() {
      var fetchApartmentStub = succeedingStub('fetchApartment',
                                  {attributes: {name: 'test apartment'}});
      var saveInvitationsStub = sinon.stub(invitations, 'saveInvitations',
        function(invitations, responseFunction) {
          var resp = [{id: 1, email: 'test1@example.com'},
            {id: 2, email: 'test2@example.com'}];
          responseFunction(resp);
        });
      var sendInvitationStub = emptyStub('sendInvitation');
      var saveHistoryStub = emptyStub('saveHistory');
      var req = {body: {emails: ['test1@example.com', 'test2@example.com']},
                 user: {attributes: {first_name: 'test', last_name: 'user', apartment_id: 1}}};

      invitations.addInvitations(req, res);

      expect(saveHistoryStub).to.have.been.calledWith(1, 'test user sent invitation to "test1@example.com"');
      expect(saveHistoryStub).to.have.been.calledWith(1, 'test user sent invitation to "test2@example.com"');
      fetchApartmentStub.restore();
      saveInvitationsStub.restore();
      sendInvitationStub.restore();
      saveHistoryStub.restore();
    });

    it('sends emails for each saved invitation when all save', function() {
      var fetchApartmentStub = succeedingStub('fetchApartment',
                                  {attributes: {name: 'test apartment'}});
      var saveInvitationsStub = sinon.stub(invitations, 'saveInvitations',
        function(invitations, responseFunction) {
          var resp = [{id: 1, email: 'test1@example.com'},
            {id: 2, email: 'test2@example.com'}];
          responseFunction(resp);
        });
      var sendInvitationStub = emptyStub('sendInvitation');
      var saveHistoryStub = emptyStub('saveHistory');

      var req = {body: {emails: ['test1@example.com', 'test2@example.com']},
                 user: {attributes: {apartment_id: 1, first_name: 'Test'}}};

      resMock.expects('json').once().
        withArgs([{email: 'test1@example.com', id: 1},
                 {email: 'test2@example.com', id: 2}]);

      invitations.addInvitations(req, res);

      expect(sendInvitationStub).to.have.been.
        calledWith(hashids.encrypt(1), 'test1@example.com', 'test apartment', 'Test');
      expect(sendInvitationStub).to.have.been.
        calledWith(hashids.encrypt(2), 'test2@example.com', 'test apartment', 'Test');

      fetchApartmentStub.restore();
      saveInvitationsStub.restore();
      sendInvitationStub.restore();
      saveHistoryStub.restore();
    });

    it('returns 404 if failed to fetch apartment', function() {
      var fetchApartmentStub = failingStub('fetchApartment');
      var req = {body: {emails: []}, user: {attributes: {apartment_id: 1}}};

      resMock.expects('json').once().
        withArgs(404, {error: 'error getting apartment'});
      invitations.addInvitations(req, res);

      expect(fetchApartmentStub).to.have.been.calledWith(1);
      fetchApartmentStub.restore();
    });
  });

  describe('getInvitation', function() {
    var res;
    var resMock;

    beforeEach(function() {
      res = { json: function() {}, render: function() {} };
      resMock = sinon.mock(res);
    });

    afterEach(function() {
      resMock.verify();
    });

    it('fetches the invitation', function() {
      var fetchInvitationStub = emptyStub('fetchInvitation');
      var req = {params: {invite: hashids.encrypt(1)}};

      invitations.getInvitation(req, res);

      expect(fetchInvitationStub).to.have.been.calledWith(1);
      fetchInvitationStub.restore();
    });

    it('returns 404 if invitation not found', function() {
      var fetchInvitationStub = failingStub('fetchInvitation');
      var req = {params: {invite: hashids.encrypt(1)}};

      resMock.expects('json').once().
        withArgs(404, {error: 'error getting invitation'});

      invitations.getInvitation(req, res);

      expect(fetchInvitationStub).to.have.been.calledWith(1);
      fetchInvitationStub.restore();
    });

    it('fetches the apartment the invitation is for', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                               {attributes: {apartment_id: 5}});
      var fetchApartmentStub = emptyStub('fetchApartment');
      var req = {params: {invite: hashids.encrypt(1)}};

      invitations.getInvitation(req, res);

      expect(fetchApartmentStub).to.have.been.calledOnce;
      expect(fetchApartmentStub).to.have.been.calledWith(5);
      fetchInvitationStub.restore();
      fetchApartmentStub.restore();
    });

    it('returns 404 if apartment not found', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                      {attributes: {id: 1, apartment_id: 5}});
      var fetchApartmentStub = failingStub('fetchApartment');
      var req = {params: {invite: hashids.encrypt(1)}};

      resMock.expects('json').once().
        withArgs(404, {error: 'failed to fetch apartment'});

      invitations.getInvitation(req, res);

      fetchInvitationStub.restore();
      fetchApartmentStub.restore();
    });

    it('renders the invitation index view if found apartment and user',
       function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                      {attributes: {id: 1, apartment_id: 5}});
      var fetchApartmentStub = succeedingStub('fetchApartment',
                  {attributes: {name: 'test name', address: 'test address'}});

      var req = {params: {invite: 1}, user: {}};

      resMock.expects('render').once().
        withArgs('components/invitations/index.html');

      invitations.getInvitation(req, res);

      fetchInvitationStub.restore();
      fetchApartmentStub.restore();
    });

    it('renders the invitation login view if found apartment and no user',
       function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                      {attributes: {id: 1, apartment_id: 5}});
      var fetchApartmentStub = succeedingStub('fetchApartment',
                  {attributes: {name: 'test name', address: 'test address'}});

      var req = {params: {invite: 1}};

      resMock.expects('render').once().
        withArgs('components/invitations/login.html');

      invitations.getInvitation(req, res);

      fetchInvitationStub.restore();
      fetchApartmentStub.restore();
    });
  });

  describe('deleteInvitation', function() {
    var res;
    var resMock;

    beforeEach(function() {
      res = { json: function() {}, send: function() {} };
      resMock = sinon.mock(res);
    });

    afterEach(function() {
      resMock.verify();
    });

    it('fetches invitation', function() {
      var fetchInvitationStub = emptyStub('fetchInvitation');
      var req = {params: {invite: hashids.encrypt(1)}};

      invitations.deleteInvitation(req, res);

      expect(fetchInvitationStub).to.have.been.calledOnce;
      expect(fetchInvitationStub).to.have.been.calledWith(1);
      fetchInvitationStub.restore();
    });

    it('returns 503 if failed to fetch invitation', function() {
      var fetchInvitationStub = failingStub('fetchInvitation');
      var req = {params: {invite: hashids.encrypt(1)}};

      resMock.expects('json').once().
        withArgs(503, {error: 'failed to get invitation'});

      invitations.deleteInvitation(req, res);

      fetchInvitationStub.restore();
    });

    it('adds current user to apartment if invitation fetched', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                               {attributes: {apartment_id: 1}});
      var addUserToApartmentStub = emptyStub('addUserToApartment');
      var req = {params: {invite: hashids.encrypt(2)}, user: {id: 4}};

      invitations.deleteInvitation(req, res);

      expect(addUserToApartmentStub).to.have.been.calledOnce;
      expect(addUserToApartmentStub).to.have.been.calledWith(4, 1);

      fetchInvitationStub.restore();
      addUserToApartmentStub.restore();
    });

    it('logs to history that invitation was accepted', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
        {attributes: {apartment_id: 1}});
      var addUserToApartmentStub = sinon.stub(invitations, 'addUserToApartment',
        function(userId, apartmentId, thenFun) {
          thenFun();
        });
      var destroyInvitationStub = emptyStub('destroyInvitation');
      var saveHistoryStub = emptyStub('saveHistory');
      var req = {params: {invite: hashids.encrypt(2)}, user:
        {id: 4, attributes: {first_name: 'test', last_name: 'user'}}};

      invitations.deleteInvitation(req, res);

      expect(saveHistoryStub).to.have.been.calledOnce;
      expect(saveHistoryStub).to.have.been.calledWith(1, 'test user accepted invitation');

      fetchInvitationStub.restore();
      addUserToApartmentStub.restore();
      destroyInvitationStub.restore();
      saveHistoryStub.restore();
    });

    it('returns 503 if failed to add user to apartment', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                               {attributes: {apartment_id: 1}});
      var addUserToApartmentStub = sinon.stub(invitations, 'addUserToApartment',
        function(userId, apartmentId, thenFun, otherFun) {
          otherFun();
        });
      var req = {params: {invite: hashids.encrypt(2)}, user: {id: 4}};

      resMock.expects('json').once().
        withArgs(503, {error: 'failed to add user to apartment'});

      invitations.deleteInvitation(req, res);

      fetchInvitationStub.restore();
      addUserToApartmentStub.restore();
    });

    it('destroys invitation after adding user to apartment', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                               {attributes: {apartment_id: 1}});
      var addUserToApartmentStub = sinon.stub(invitations, 'addUserToApartment',
        function(userId, apartmentId, thenFun) {
          thenFun();
        });
      var destroyInvitationStub = emptyStub('destroyInvitation');
      var saveHistoryStub = emptyStub('saveHistory');
      var req = {params: {invite: hashids.encrypt(2)}, user: {id: 4,
        attributes: {first_name: 'test', last_name: 'user'}}};

      invitations.deleteInvitation(req, res);

      expect(destroyInvitationStub).to.have.been.calledOnce;
      expect(destroyInvitationStub).to.have.been.calledWith(2);

      fetchInvitationStub.restore();
      addUserToApartmentStub.restore();
      destroyInvitationStub.restore();
      saveHistoryStub.restore();
    });

    it('returns 503 if failed to destroy invitation', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                               {attributes: {apartment_id: 1}});
      var addUserToApartmentStub = sinon.stub(invitations, 'addUserToApartment',
        function(userId, apartmentId, thenFun) {
          thenFun();
        });
      var destroyInvitationStub = failingStub('destroyInvitation');
      var saveHistoryStub = emptyStub('saveHistory');
      var req = {params: {invite: hashids.encrypt(2)}, user: {id: 4,
        attributes: {first_name: 'test', last_name: 'user'}}};

      resMock.expects('json').once().
        withArgs(503, {error: 'failed to destroy invitation'});

      invitations.deleteInvitation(req, res);

      fetchInvitationStub.restore();
      addUserToApartmentStub.restore();
      destroyInvitationStub.restore();
      saveHistoryStub.restore();
    });

    it('returns 200 if successfully destroyed invitation', function() {
      var fetchInvitationStub = succeedingStub('fetchInvitation',
                                               {attributes: {apartment_id: 1}});
      var addUserToApartmentStub = sinon.stub(invitations, 'addUserToApartment',
        function(userId, apartmentId, thenFun) {
          thenFun();
        });
      var destroyInvitationStub = succeedingStub('destroyInvitation');
      var saveHistoryStub = emptyStub('saveHistory');
      var req = {params: {invite: hashids.encrypt(2)}, user: {id: 4,
        attributes: {first_name: 'test', last_name: 'user'}}};

      resMock.expects('send').once().withArgs(200);

      invitations.deleteInvitation(req, res);

      fetchInvitationStub.restore();
      addUserToApartmentStub.restore();
      destroyInvitationStub.restore();
      saveHistoryStub.restore();
    });
  });

});

