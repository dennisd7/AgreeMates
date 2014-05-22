// Messages routes

'use strict';

var MessageModel = require('../models/message').model;
var CommentModel = require('../models/comment').model;
var UserModel = require('../models/user').model;
var Bookshelf = require('bookshelf');

// Gets all messages
function getMessages(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;

  Bookshelf.DB.knex('messages')
    .join('users as author', 'messages.user_id', '=', 'author.id', 'left outer')
    .join('comments', 'messages.id', '=', 'comments.message_id', 'left outer')
    .join('users', 'comments.user_id', '=', 'users.id', 'left outer')
    .where('messages.apartment_id', '=', apartmentId)
    .select('messages.id as messageId', 'messages.subject', 'messages.body',
            'author.first_name as authorName', 'messages.date as messageDate',
            'users.first_name as commentAuthor', 'comments.id as commentId',
            'comments.body as commentBody', 'comments.date as commentDate', 
            'messages.user_id as user_id', 'comments.user_id as comment_user_id')
    .orderBy('messageId', 'desc')
    .then(function(rows) {
      var messages = [];
      var comments = [];
      if (rows.length === 0) {
        res.json({messages: messages});
        return;
      }

      // set lastBillId to invalid ID so algorithm will owrk
      var lastMessageId = -1;
      var subject, text, author, date, user_id;
      for (var i = 0; i < rows.length; i++) {

        // If message_id is different than lastMessageId then
        // all the comments for the current message have been
        // added to comments[]. Push the current message and comments
        // on array and start next message
        if (rows[i].messageId !== lastMessageId) {
          if (lastMessageId !== -1) {
            messages.push({
              id: lastMessageId,
              subject: subject,
              body: text,
              author: author,
              date: date,
              comments: comments,
              user_id: user_id
            });
          }
          // empty comments since last message is done and set
          // all the fields for the new message
          comments = [];
          lastMessageId = rows[i].messageId;
          subject = rows[i].subject;
          text = rows[i].body;
          author = rows[i].authorName;
          date = rows[i].messageDate;
          user_id = rows[i].user_id;
        }
        if (rows[i].commentId !== null) {
          comments.push({
            id: rows[i].commentId,
            author: rows[i].commentAuthor,
            body: rows[i].commentBody,
            date: rows[i].commentDate,
            user_id: rows[i].comment_user_id
          });
        }
      }
      // Push last message onto the messages array
      messages.push({
        id: lastMessageId,
        subject: subject,
        body: text,
        author: author,
        date: date,
        comments: comments,
        user_id: user_id
      });
      res.json({messages: messages});
    }).otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

// Adds a message
function addMessage(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  // Copy over fields from request
  var apartmentId = req.user.attributes.apartment_id;
  var userId = req.user.attributes.id;
  var subject = req.body.subject;
  var text = req.body.body;
  var date = new Date();

  // Check fields for validity
  if (subject === undefined) {
    res.json(400, {error: 'Invalid message subject.'});
    return;
  } else if (text === undefined) {
    res.json(400, {error: 'Invalid message body.'});
    return;
  }

  // Create the new message in the database.
  new MessageModel({apartment_id: apartmentId, user_id: userId,
    subject: subject, body: text, date: date})
    .save()
    .then(function (model) {
      res.json(model);
    }).otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

// Updates a message
function editMessage(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  // Copy over fields from the request
  var apartmentId = req.user.attributes.apartment_id;
  var userId = req.user.attributes.id;
  var messageId = req.params.message;
  var subject = req.body.subject;
  var text = req.body.body;

  if (!isValidId(messageId)) {
    res.json(400, {error: 'Invalid message ID.'});
    return;
  } else if (subject === undefined) {
    res.json(400, {error: 'Invalid message subject.'});
    return;
  } else if (text === undefined) {
    res.json(400, {error: 'Invalid message body.'});
  }

  // Get and update the model from the database
  new MessageModel({id: messageId, apartment_id: apartmentId, user_id: userId})
    .save({subject: subject, body: text})
    .then(function() {
      res.send(200);
    }).otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

// Deletes a message
function deleteMessage(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;
  var messageId = req.params.message;
  var userId = req.user.attributes.id;

  if (!isValidId(messageId)) {
    res.json(400, {error: 'Invalid message ID.'});
    return;
  }

  // Destroy all of the comments on the message and then
  // destroy the message itself. The user must be the one
  // who created the message.
  new CommentModel()
    .query('where', 'message_id', '=', messageId, 'AND',
           'user_id', '=', userId)
    .destroy()
    .then(function() {
      new MessageModel()
        .query('where', 'id', '=', messageId, 'AND',
               'apartment_id', '=', apartmentId)
        .destroy()
        .then(function() {
          res.send(200);
        }).otherwise(function() {
          res.json(503, {error: 'Error deleting message'});
        });
    }).otherwise(function() {
      res.json(503, {error: 'Error deleting comments'});
    });
}

// Checks if a bill ID is valid
function isValidId(id) {
  return isInt(id) && id > 0;
}

// Checks if a value is an integer
function isInt(value) {
  return !isNaN(value) && parseInt(value) == value;
}

// Sets up all routes
function setup(app) {
  app.get('/messages', getMessages);
  app.post('/messages', addMessage);
  app.put('/messages/:message', editMessage);
  app.delete('/messages/:message', deleteMessage);
}

module.exports.getMessages = getMessages;
module.exports.addMessage = addMessage;
module.exports.editMessage = editMessage;
module.exports.deleteMessage = deleteMessage;
module.exports.setup = setup;
