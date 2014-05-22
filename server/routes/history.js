// History routes
// jshint camelcase: false

'use strict';

var HistoryModel = require('../models/history').model;
var HistoryCollection = require('../models/history').collection;

function getLatestHistory(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;

  new HistoryCollection()
    .query(function(qb) {
      qb.where('apartment_id', '=', apartmentId);
      qb.orderBy('date', 'desc');
      qb.limit(10);
    })
    .fetch()
    .then(function(collection) {
      res.json({history: collection});
    })
    .otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

function getPastHistory(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;
  var id = req.params.id;

  new HistoryCollection()
    .query(function(qb) {
      qb.where('apartment_id', '=', apartmentId);
      qb.where('id', '<', id);
      qb.orderBy('date', 'desc');
      qb.limit(10);
    })
    .fetch()
    .then(function(collection) {
      res.json({history: collection});
    })
    .otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

// Set up all routes
function setup(app) {
  app.get('/history', getLatestHistory);
  app.get('/history/:id', getPastHistory);
}

module.exports.getLatestHistory = getLatestHistory;
module.exports.getPastHistory = getPastHistory;
module.exports.setup = setup;
