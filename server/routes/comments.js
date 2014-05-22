// Comments routes

'use strict';

var MessageModel = require('../models/message').model;
var CommentModel = require('../models/comment').model;

var comments = function(app) {

  app.post('/messages/:message/comments', function(req, res) {
    
    // Check that user is authorized
    if(req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }
    
    // Copy over fields from request
    var apartmentId = req.user.attributes.apartment_id;
    var userId = req.user.attributes.id;
    var messageId = req.params.message;
    var text = req.body.body;
    var date = new Date();

    if (!isValidId(messageId)) {
      res.json(400, {error: 'Invalid message id.'});
      return;
    } else if (text === null) {
      res.json(400, {error: 'Comment content cannot be null.'});
      return;
    }

    new CommentModel({user_id: userId, message_id: messageId, 
                     body: text, date: date})
      .save()
      .then(function(model) {
        model.author = req.user.attributes.first_name;
        res.json(model);
      }).otherwise(function(error) {
        res.json(503, {error: 'Database error'});
      });
    
  });

  app.put('/messages/:message/comments/:comment', function(req, res) {
    
    // Check if user is authorized
    if(req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }

    // Copy over the fields
    var userId = req.user.attributes.id;
    var messageId = req.params.message;
    var commentId = req.params.comment;
    var text = req.body.text;

    if(!isValidId(messageId)) {
      res.json(400, {error: 'Invalid message id.'});
      return;
    } else if(!isValidId(commentId)) {
      res.json(400, {error: 'Invalid comment id.'});
      return;
    } else if(text === null) {
      res.json(400, {error: 'Comment body cannot be null.'});
      return;
    }

    new CommentModel({id: commentId, message_id: messageId, user_id: userId})
      .save({body: text})
      .then(function() {
        res.json({id: model.attributes.id});
      }).otherwise(function(error) {
        res.json(503, {error: 'Database error.'});
      });    
  });

  app.delete('/messages/:message/comments/:comment', function(req, res) {
    // Check if user is authorized
    if(req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }
 
    var userId = req.user.attributes.id;
    var messageId = req.params.message;
    var commentId = req.params.comment;

    // Check if fields are valid  
    if(!isValidId(messageId)) {
      res.json(400, {error: 'Invalid message id.'});
      return;
    } else if(!isValidId(commentId)) {
      res.json(400, {error: 'Invalid comment id.'});
      return;
    }

    // Get the comment, make sure the user_id is the user
    // trying to delete it.
    new CommentModel()
      .query('where', 'message_id', '=', messageId, 'AND',
             'id', '=', commentId, 'AND',
             'user_id', '=', userId)
      .destroy()
      .then(function() {
        res.send(200);
      }).otherwise(function(error) {
        res.json(503, {error: 'Database error.'});
      });
  });

  // Checks if a value is an integer
  function isInt(value) {
    return !isNaN(value) && parseInt(value) == value;
  }

  // Checks if a bill ID is valid
  function isValidId(id) {
    return isInt(id) && id > 0;
  }
};

module.exports = comments;
