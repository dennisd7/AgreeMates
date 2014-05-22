// Supplies routes
// jshint camelcase: false

'use strict';

var SupplyModel = require('../models/supply').model;
var SupplyCollection = require('../models/supply').collection;
var HistoryModel = require('../models/history').model;

// Gets all supplies for the user's apartment
function getSupplies(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;

  new SupplyCollection()
    .query(function(qb) {
      qb.where('apartment_id', '=', apartmentId);
      qb.orderBy('id', 'desc');
    })
    .fetch()
    .then(function(model) {
      var supplies = [];

      for (var i = 0; i < model.length; i++) {
        var supply = model.models[i].attributes;
        supplies.push({
          id: supply.id,
          name: supply.name,
          status: supply.status
        });
      }

      res.json({supplies: supplies});
    }).otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

// Adds a supply to the user's apartment
function addSupply(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;
  var name = req.body.name;
  var status = req.body.status;

  if (!isValidName(name)) {
    res.json(400, {error: 'Invalid supply name.'});
    return;
  } else if (!isValidStatus(status)) {
    res.json(400, {error: 'Invalid supply status.'});
    return;
  }

  new SupplyModel({apartment_id: apartmentId,
    name: name.trim(), status: status})
    .save()
    .then(function(model) {
      var supply = model.attributes;

      var historyString = req.user.attributes.first_name + ' ' +
        req.user.attributes.last_name + ' added Supply "' +
        name.trim() + '"';

      new HistoryModel({apartment_id: apartmentId,
        history_string: historyString, date: new Date()})
        .save()
        .then(function() {})
        .otherwise(function(error) {console.log(error)});

      res.json({id: supply.id, name: supply.name, status: supply.status});
    }).otherwise(function(error) {
      console.log(error);
      res.json(503, {error: 'Database error.'});
    });
}

// Updates a supply
function updateSupply(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;
  var supplyId = req.params.supply;
  var name = req.body.name;
  var status = req.body.status;

  if (!isValidId(supplyId)) {
    res.json(400, {error: 'Invalid supply ID.'});
    return;
  } else if (!isValidName(name)) {
    res.json(400, {error: 'Invalid supply name.'});
    return;
  } else if (!isValidStatus(status)) {
    res.json(400, {error: 'Invalid supply status.'});
    return;
  }

  new SupplyModel({id: supplyId, apartment_id: apartmentId})
    .save({name: name.trim(), status: status}, {patch: true})
    .then(function() {
      res.send(200);
    })
    .otherwise(function() {
      res.json(400, {error: 'Invalid supply ID.'});
    });
}

// Deletes a supply
function deleteSupply(req, res) {
  if (req.user === undefined) {
    res.json(401, {error: 'Unauthorized user.'});
    return;
  }

  var apartmentId = req.user.attributes.apartment_id;
  var supplyId = req.params.supply;

  if (!isValidId(supplyId)) {
    res.json(400, {error: 'Invalid supply ID.'});
    return;
  }

  new SupplyModel({id: supplyId, apartment_id: apartmentId})
    .destroy()
    .then(function() {
      res.send(200);
    })
    .otherwise(function() {
      res.json(503, {error: 'Database error.'});
    });
}

// Checks if a supply name is valid
function isValidName(name) {
  return name !== undefined && name !== null && name !== '';
}

// Checks if a supply ID is valid
function isValidId(id) {
  return isInt(id) && id > 0;
}

// Checks if a supply status is valid
function isValidStatus(status) {
  return isInt(status) && [0, 1, 2].indexOf(parseInt(status)) !== -1;
}

// Checks if a value is an integer
function isInt(value) {
  return !isNaN(value) && parseInt(value) == value;
}

// Sets up all routes
function setup(app) {
  app.get('/supplies', getSupplies);
  app.post('/supplies', addSupply);
  app.put('/supplies/:supply', updateSupply);
  app.delete('/supplies/:supply', deleteSupply);
}

module.exports.getSupplies = getSupplies;
module.exports.addSupply = addSupply;
module.exports.updateSupply = updateSupply;
module.exports.deleteSupply = deleteSupply;
module.exports.setup = setup;
