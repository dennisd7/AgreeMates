// Invitation routes
// jshint camelcase: false

'use strict';

var ApartmentModel = require('../models/apartment').model;
var InvitationModel = require('../models/invitation').model;
var InvitationCollection = require('../models/invitation').collection;
var HistoryModel = require('../models/history').model;
var UserModel = require('../models/user').model;
var nodemailer = require('nodemailer');
var Hashids = require('hashids');
var hashids = new Hashids(process.env.INVITE_SALT, 8);

var Invitations = {
  setup: function(app) {
    app.post('/invitations', Invitations.addInvitations);
    app.get('/invitations/:invite', Invitations.getInvitation);
    app.delete('/invitations/:invite', Invitations.deleteInvitation);
  },
  addInvitations: function(req, res) {
    if (req.user === undefined || req.body === undefined) {
      res.json(400, {error: 'Missing user or body'});
      return;
    }

    var apartmentId = req.user.attributes.apartment_id;
    if (apartmentId === undefined) {
      res.json(404, {error: 'could not fetch id'});
      return;
    }

    Invitations.fetchApartment(apartmentId,
      function then(apartment) {
        var emails = req.body.emails;
        var apartmentName = apartment.attributes.name;
        var firstName = req.user.attributes.first_name;
        var invitations = [];
        for (var i = 0; i < emails.length; i++) {
          invitations[i] = Invitations.createInvitation(apartmentId, emails[i]);
        }
        Invitations.saveInvitations(invitations, function(resp) {
          if (resp.length !== invitations.length) {
            res.json(503, {error: 'Error creating invitations'});
          } else {
            resp.forEach(function(invitation) {
              var historyString = req.user.attributes.first_name + ' ' +
                req.user.attributes.last_name + ' sent invitation to "' +
                invitation.email + '"';
              Invitations.saveHistory(apartmentId, historyString);
              var hashedId = hashids.encrypt(invitation.id);
              Invitations.sendInvitation(hashedId, invitation.email,
                                         apartmentName, firstName);
            });
            res.json(resp);
          }
        });
      },
      function otherwise(error) {
        console.log(error);
        res.json(404, {error: 'error getting apartment'});
      });
  },
  getInvitation: function(req, res) {
    var inviteNumber = hashids.decrypt(req.params.invite)[0];
    Invitations.fetchInvitation(inviteNumber,
      function then(model) {
        Invitations.fetchApartment(model.attributes.apartment_id,
          function then(model2) {
            var user = req.user;
            if (user != null) {
              res.render('components/invitations/index.html', {
                invId: req.params.invite,
                aptName: model2.attributes.name,
                aptAddress: model2.attributes.address
              });
            } else {
              res.render('components/invitations/login.html', {
                invId: req.params.invite
              });
            }
          },
          function otherwise(error) {
            console.log(error);
            res.json(404, {error: 'failed to fetch apartment'});
          });
      },
      function otherwise(error) {
        console.log(error);
        res.json(404, {error: 'error getting invitation'});
      });
  },
  deleteInvitation: function(req, res) {
    var inviteNumber = hashids.decrypt(req.params.invite)[0];
    Invitations.fetchInvitation(inviteNumber,
      function(model) {
        Invitations.addUserToApartment(req.user.id,
                                       model.attributes.apartment_id,
          function() {
            var historyString = req.user.attributes.first_name + ' ' +
              req.user.attributes.last_name + ' accepted invitation';
            Invitations.saveHistory(model.attributes.apartment_id,
              historyString);
            Invitations.destroyInvitation(inviteNumber,
              function then() { res.send(200); },
              function otherwise(error) {
                console.log(error);
                res.json(503, {error: 'failed to destroy invitation'});
              });
          },
          function otherwise(error) {
            console.log(error);
            res.json(503, {error: 'failed to add user to apartment'});
          });
      },
      function otherwise(error) {
        console.log(error);
        res.json(503, {error: 'failed to get invitation'});
      });
  },
  fetchApartment: function(apartmentId, thenFun, otherwiseFun) {
    new ApartmentModel({id: apartmentId})
      .fetch()
      .then(thenFun)
      .otherwise(otherwiseFun);
  },
  fetchInvitation: function(invitationId, thenFun, otherwiseFun) {
    new InvitationModel({id: invitationId})
      .fetch()
      .then(thenFun)
      .otherwise(otherwiseFun);
  },
  saveInvitations: function(invitations, thenFun) {
    new InvitationCollection(invitations)
    .mapThen(function(model) {
      return model.save().then(function() {
        return {
          id: model.get('id'),
          apartment_id: model.get('apartment_id'),
          email: model.get('email')
        };
      });
    })
    .then(thenFun);
  },
  createInvitation: function(apartmentId, email) {
    return new InvitationModel({
            apartment_id: apartmentId,
            email: email
    });
  },
  destroyInvitation: function(invitationId, thenFun, otherwiseFun) {
    new InvitationModel({id: invitationId})
    .destroy()
    .then(thenFun)
    .otherwise(otherwiseFun);
  },
  addUserToApartment: function(userId, apartmentId, thenFun, otherwiseFun) {
    new UserModel({id: userId})
      .save({apartment_id: apartmentId}, {patch: true})
      .then(thenFun)
      .otherwise(otherwiseFun);
  },
  saveHistory: function(apartmentId, historyString) {
    new HistoryModel({apartment_id: apartmentId,
                     history_string: historyString, date: new Date()})
      .save()
      .then(function() {})
      .otherwise(function() {});
  },
  sendInvitation: function(id, email, aptName, firstName) {
    var smtpTransport = nodemailer.createTransport('SMTP', {
      service: 'Mandrill',
      auth: {
        user: process.env.MANDRILL_USER,
        pass: process.env.MANDRILL_PASS
      }
    });
    var mailOptions = {
      from: 'invitations@agreemates.com',
      to: email,
      subject: 'You have been invited to an AgreeMates apartment',
      generateTextFromHTML: true,
      html: 'Hi <br>' +
            'You have been invited to join the apartment ' + aptName + ' on AgreeMates.com' +
            'by ' + firstName +'! <br><br>' +
            'Click ' + '<a href="' + process.env.MANDRILL_INVURL + id + '">here</a> to join.<br><br>' +
            'The AgreeMates Team'

    };
    smtpTransport.sendMail(mailOptions, function(error, response) {
      if (error) {
        console.log(error);
      } else {
        console.log('Message sent: ' + response.message);
      }
    });
  }
};

module.exports = Invitations;
