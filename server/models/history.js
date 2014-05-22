/*
 * This is the model representation for history
 * attributes:
 *   id              int
 *   date            date, creation date
 *   history_string  string, message string
 *   apartment_id    int
 * invariant: no attributes can be null,
 * 		and apartment_id references an id apartments.
 */

'use strict';

var Bookshelf = require('bookshelf').DB;

var ApartmentModel = require('./apartment').model;

exports.model = Bookshelf.Model.extend({
  tableName: 'history',
  apartment: function() {
    return this.belongsTo(ApartmentModel);
  },
});

exports.collection = Bookshelf.Collection.extend({
  model: exports.model
});
