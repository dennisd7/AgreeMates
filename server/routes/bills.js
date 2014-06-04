// Bill routes

'use strict';

var BillModel = require('../models/bill').model;
var BillCollection = require('../models/bill').collection;
var PaymentModel = require('../models/payment').model;
var PaymentCollection = require('../models/payment').collection;
var HistoryModel = require('../models/history').model;
var Bookshelf = require('bookshelf');

// Checks if a value is an integer
function isInt(value) {
  // jshint eqeqeq: false
  return !isNaN(value) && parseInt(value) == value;
}

//Checks that date is on or after current date.
// Note this only works for yyyy-mm-dd format of date
  function isValidDate(date){
    var currentDate = new Date();
    currentDate.setHours(0);
    currentDate.setMinutes(0);
    currentDate.setSeconds(0);
    currentDate.setMilliseconds(0);
    return date >= currentDate;
  }

// Checks if a bill ID is valid
function isValidId(id) {
  return isInt(id) && id > 0;
}

// Checks if a bill name is valid
function isValidName(name) {
  return name !== undefined && name !== null && name !== '';
}

// Creates a valid new due date for a bill
function createDueDate(date) {
  var month = (date.getMonth() + 2) % 12;
  var duedate = date;
  // If the year changed then update it
  if (month === 1) {
    duedate.setFullYear(date.getFullYear() + 1);
  }

  // If the date is past the 28th we need to set a new
  // date that is valid depending on the month
  if (date.getDate() > 28) {
    if (month === 2) {
      duedate.setDate(28);
    } else if (month === 4 | month === 6 |
              month === 9 | month === 11) {
      duedate.setDate(30);
    }
  }
  duedate.setMonth(month - 1);
  return duedate;
}

// Checks if an array of payment models are all paid
function allPaymentsPaid(payments) {
  for (var i = 0; i < payments.models.length; i++) {
    var payment = payments.models[i].attributes;
    if (payment.paid !== true) {
      return false;
    }
  }
  return true;
}

// Takes a collection of bills with the same reocurring id
// and a new date for a recurring bill. Goes through and if the
// new date is past all of the bills in the collections duedates
// then return true to generate a new instance of the reocurring bill
function needInstance(billCollection, newDate) {
  if (billCollection === undefined || newDate === undefined ||
     billCollection === null || newDate === null) {
    return false;
  }
  for (var i = 0; i < billCollection.length; i++) {
    var billDate = billCollection.models[i].attributes.duedate;
    if (newDate <= billDate) {
      return false;
    }
  }
  return true;
}

var Bills = {

  // Sets up all routes
  setup: function(app) {
    app.get('/bills', Bills.getBills);
    app.post('/bills', Bills.addBill);
    app.put('/bills/:bill/payment', Bills.updatePayment);
    app.put('/bills/:bill', Bills.editBill);
    app.delete('/bills/:bill', Bills.deleteBill);
  },

  // Gets all bills for an apartment
  getBills: function(req, res) {
    if (req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }

    if (req.query.type === undefined || (req.query.type !== 'resolved' &&
       req.query.type !== 'unresolved')) {
      res.json(400, {error: 'Unexpected type parameter.'});
      return;
    }

    var apartmentId = req.user.attributes.apartment_id;
    if (apartmentId === undefined) {
      res.json(404, {error: 'No apartment ID defined.'});
      return;
    }

    Bills.fetchBills(apartmentId, req.query.type,
      function then(rows) {
        var bills = [];
        var payments = [];
        if (rows.length === 0) {
          res.json({bills: bills});
          return;
        }

        // set lastBillId to invalid Id so algorithm will work
        var lastBillId = -1;
        var name, amount, createDate, dueDate;
        var frequency, resolved, creatorId, payTo;
        for (var i = 0; i < rows.length; i++) {

          // If billid is different, then all payments for the current
          // bill have been pushed on payments. We push the bill then
          if (rows[i].bill_id !== lastBillId) {
            if (lastBillId !== -1) {
              bills.push({
                id: lastBillId,
                name: name,
                amount: amount,
                createDate: createDate,
                dueDate: dueDate,
                frequency: frequency,
                resolved: resolved,
                creatorId: creatorId,
                payTo: payTo,
                payments: payments
              });
            }
            // empty payments since bill is done and set all fields for the
            // new bill
            payments = [];
            lastBillId = rows[i].bill_id;
            name = rows[i].name;
            amount = rows[i].total;
            createDate = rows[i].createdate;
            dueDate = rows[i].duedate;
            resolved = rows[i].billPaid;
            frequency = rows[i].interval;
            creatorId = rows[i].creatorId;
            payTo = rows[i].payTo;
          }
          payments.push({
            userId: rows[i].user_id,
            name: rows[i].first_name,
            amount: rows[i].amount,
            paid: rows[i].userPaid
          });
        }
        // Push the last bill onto the bills array
        bills.push({
              id: lastBillId,
              name: name,
              amount: amount,
              createDate: createDate,
              dueDate: dueDate,
              frequency: frequency,
              resolved: resolved,
              creatorId: creatorId,
              payTo: payTo,
              payments: payments
        });
        res.json({bills: bills});
    },
    function otherwise() {
        res.json(503, {error: 'Database error.'});
    });
  },

  // Adds a bill to an apartment
  addBill: function(req, res) {
    if (req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }

    var duedate = new Date(req.body.date);

    if (!isValidName(req.body.name)) {
      res.json(400, {error: 'Invalid bill name.'});
      return;
    } else if (req.body.total === undefined || req.body.total < 0) {
      res.json(400, {error: 'Invalid bill total.'});
      return;
    } else if (req.body.interval === undefined || req.body.interval < 0) {
      res.json(400, {error: 'Invalid bill interval.'});
      return;
    } else if (req.body.date === undefined) {
      res.json(400, {error: 'Invalid due date.'});
      return;
    } else if (req.body.roommates === undefined) {
      res.json(400, {error: 'Invalid roommates.'});
      return;
    } else if (!isValidDate(duedate)) {
      res.json(400, {error: 'Invalid due date'});
      return;
    }

    var bill = Bills.createBill(req);
    var roommates = req.body.roommates;

    Bills.saveBill(bill,
      function then(model) {
        var historyString = req.user.attributes.first_name + ' ' +
          req.user.attributes.last_name + ' added bill "' +
          bill.attributes.name.trim() + '"';
        Bills.saveHistory(historyString, bill.attributes.apartment_id,
          function otherwise() {
            res.json(503, {error: 'Database error.'});
          });

        // add payment models for each of the payments for the bill
        Bills.savePayments(model.attributes.id, roommates,
          function otherwise() {
            res.json(503, {error: 'Database error.'});
          });
        res.json({id: model.attributes.id});
      },
      function otherwise() {
        res.json(503, {error: 'Database error.'});
      });
  },

  // Update a bill's payment
  updatePayment: function(req, res) {
    if (req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }

    var apartmentId = req.user.attributes.apartment_id;
    var userId = req.user.attributes.id;
    var billId = req.params.bill;
    var paid = req.body.paid;

    if (!isValidId(req.params.bill)) {
      res.json(400, {error: 'Invalid bill ID.'});
      return;
    } else if (req.body.paid !== 'true' && req.body.paid !== 'false') {
      res.json(400, {error: 'Invalid paid parameter.'});
      return;
    }

    // Fetch and update the payment
    Bills.fetchPayment(billId, userId,
      function then(payment) {
        payment.attributes.paid = paid;
        Bills.savePayment(payment,
          function then() {
            Bills.updatePaymentHistory(req, billId, apartmentId, paid);

            // Check if all payments for bill have been paid
            // if so, mark bill as paid
            Bills.fetchPayments(billId,
              function then(model) {
                if (allPaymentsPaid(model)) {
                  Bills.fetchBill(billId, apartmentId,
                    function then(bill) {
                      bill.attributes.paid = true;
                      Bills.saveBill(bill);
                    },
                    function otherwise() {
                      res.json(503, {error: 'Database error.'});
                    });

                  Bills.fetchBillWithPayments(billId, apartmentId,
                    function then(oldBill) {
                      var historyString = 'The bill "' +
                        oldBill.attributes.name + '" is now resolved';
                      Bills.saveHistory(historyString, apartmentId,
                        function otherwise() {
                          res.json(503, {error: 'Database error.'});
                        });

                      // If the bill is reocurring we need to make a new
                      // instance of it and it's payments
                      if (oldBill.attributes.interval === 3) {
                        Bills.createNewReocurring(oldBill, res);
                      } else {
                        res.send(200);
                      }
                    },
                    function otherwise() {
                      res.json(503, {error: 'Database error.'});
                    });
                } else {
                  // Unresolve the bill
                  Bills.fetchBill(billId, apartmentId,
                    function then(bill) {
                      bill.attributes.paid = false;
                      Bills.saveBill(bill);
                    },
                    function otherwise() {
                      res.json(503, {error: 'Database error.'});
                    });
                }
              });
          },
          function otherwise() {
            res.json(503, {error: 'Database error.'});
          });
      },
      function otherwise() {
        res.json(503, {error: 'Database error.'});
      });
  },

  // Edit a bill
  editBill: function(req, res) {
    if (req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }

    // Copy over fields from the request
    var apartmentId = req.user.attributes.apartment_id;
    var billId = req.params.bill;
    var name = req.body.name;
    var total = req.body.total;
    var interval = req.body.interval;
    var date = new Date(req.body.date);
    var roommates = req.body.roommates;

    // Check for validity of fields
    if (!isValidId(billId)) {
      res.json(400, {error: 'Invalid bill ID.'});
      return;
    } else if (!isValidName(name)) {
      res.json(400, {error: 'Invalid bill name.'});
      return;
    } else if (!isValidDate(date)) {
      res.json(400, {error: 'Invalid due date'});
      return;
    } else if (req.body.total === undefined || req.body.total < 0) {
      res.json(400, {error: 'Invalid bill total.'});
      return;
    }

    // Destroy all the payments which are references to the billId
    // This must be done since the roommates paying on a bill could be
    // different.
    Bills.destroyPayments(billId,
      function then() {
        // Edit the bill
        Bills.fetchBill(billId, apartmentId,
          function then(bill) {
            bill.attributes.name = name;
            bill.attributes.amount = total;
            bill.attributes.duedate = date;
            bill.attributes.interval = interval;
            Bills.saveBill(bill,
              function then() {
                var historyString = req.user.attributes.first_name + ' ' +
                  req.user.attributes.last_name + ' edited bill "' + name + '"';
                Bills.saveHistory(historyString, apartmentId,
                  function otherwise() {
                    res.json(503, {error: 'Database error.'});
                  });

                // Add new payments for all the users who need to pay
                Bills.savePayments(billId, roommates,
                  function otherwise() {
                      res.json(503, {error: 'Database error.'});
                  });
                res.send(200);
              },
              function otherwise() {
                res.json(503, {error: 'Database error.'});
              });
          },
          function otherwise() {
            res.json(503, {error: 'Database error.'});
          });
      },
      function otherwise() {
        res.json(503, {error: 'Database error.'});
      });
  },

  // Delete a bill
  deleteBill: function(req, res) {
    if (req.user === undefined) {
      res.json(401, {error: 'Unauthorized user.'});
      return;
    }

    var apartmentId = req.user.attributes.apartment_id;
    var billId = req.params.bill;

    if (!isValidId(billId)) {
      res.json(400, {error: 'Invalid bill ID.'});
      return;
    }

    Bills.fetchBill(billId, apartmentId,
      function then(model) {
        var historyString = req.user.attributes.first_name + ' ' +
          req.user.attributes.last_name + ' deleted the bill "' +
          model.attributes.name.trim() + '"';
        Bills.saveHistory(historyString, apartmentId,
          function otherwise() {
            res.json(503, {error: 'Database error.'});
          });

        // Destroy all the payments for a bill and then destroy
        // the bill.
        Bills.destroyPayments(billId,
          function then() {
            Bills.destroyBill(billId, apartmentId,
              function then() {
                res.send(200);
              },
              function otherwise() {
                res.json(503, {error: 'Database error.'});
              });
          },
          function otherwise() {
            res.json(503, {error: 'Database error.'});
          });
      },
      function otherwise() {
        res.json(503, {error: 'Database error.'});
      });
  },

  // Gets all the bills for an apartment and their payments
  fetchBills: function(apartmentId, resolved, thenFun, otherwiseFun) {
    // Fetch all the apartments bills and their corresponding
    // payments
    Bookshelf.DB.knex('bills')
      .join('payments', 'bills.id', '=', 'payments.bill_id')
      .join('users as creator', 'bills.user_id', '=', 'creator.id')
      .join('users', 'payments.user_id', '=', 'users.id')
      .where('bills.apartment_id', '=', apartmentId)
      .where('bills.paid', '=', (resolved === 'resolved'))
      .select('bills.amount as total', 'payments.user_id',
              'bills.paid as billPaid', 'payments.paid as userPaid',
              'bills.createdate', 'bills.duedate', 'bills.name',
              'bills.interval', 'users.first_name', 'users.id',
              'payments.bill_id', 'payments.amount',
              'bills.user_id as creatorId', 'creator.first_name as payTo')
      .orderBy('payments.bill_id')
      .then(thenFun)
      .otherwise(otherwiseFun);
  },

  // Fetches all the payments associated with a bill as a collection
  fetchPayments: function(billId, thenFun, otherFun) {
    new PaymentCollection()
      .query('where', 'bill_id', '=', billId)
      .fetch()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Gets a users payment for a bill from the database
  fetchPayment: function(billId, userId, thenFun, otherFun) {
    new PaymentModel()
      .query('where', 'bill_id', '=', billId, 'AND',
             'user_id', '=', userId)
      .fetch()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Create a bill model from a post request
  createBill: function(req) {
    var name = req.body.name;
    var amount = req.body.total;
    var apartment_id = req.user.attributes.apartment_id;
    var user_id = req.user.attributes.id;
    var interval = req.body.interval;
    // Need to increment the day the bill is due
    // due to format received from front end
    var duedate = new Date(req.body.date);

    // Build up the bill model
    return new BillModel({apartment_id: apartment_id, user_id: user_id,
      name: name, amount: amount, interval: interval, duedate: duedate,
      createdate: new Date(), paid: false});
  },

  // Destroys all payments associated with a bill
  destroyPayments: function(billId, thenFun, otherFun) {
    new PaymentModel()
      .query('where', 'bill_id', '=', billId)
      .destroy()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Destroys a single bill
  destroyBill: function(billId, apartmentId, thenFun, otherFun) {
    new BillModel()
      .query('where', 'id', '=', billId, 'AND',
             'apartment_id', '=', apartmentId)
      .destroy()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Creates and saves a new history model to the database
  saveHistory: function(historyString, apartmentId, otherFun) {
    new HistoryModel({apartment_id: apartmentId,
      history_string: historyString, date: new Date()})
      .save()
      .otherwise(otherFun);
  },

  // Fetches a single bill
  fetchBill: function(billId, apartmentId, thenFun, otherFun) {
    new BillModel({id: billId, apartment_id: apartmentId})
      .fetch()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Fetches a single bill with its related payments.
  fetchBillWithPayments: function(billId, apartmentId, thenFun, otherFun) {
    new BillModel()
      .query('where', 'id', '=', billId, 'AND',
             'apartment_id', '=', apartmentId)
      .fetch({withRelated: ['payment']})
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Takes a bill id and an array of roommates, and generates and
  // saves payments for all roommates in the array.
  savePayments: function(billId, roommates, otherFun) {
    for(var i = 0; i < roommates.length; i++) {
      new PaymentModel({paid: false, amount: roommates[i].amount,
        user_id: roommates[i].id, bill_id: billId})
        .save()
        .otherwise(otherFun);
    }
  },

  // Saves changes made to a bill to the database
  saveBill: function(bill, thenFun, otherFun) {
    bill.save()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Saves changes made to a payment to the database
  savePayment: function(payment, thenFun, otherFun) {
    payment.save()
      .then(thenFun)
      .otherwise(otherFun);
  },

  // Takes an old bill that is reoccurring and will generate
  // a new instance of it if needed.
  createNewReocurring: function(oldBill, res) {
    var duedate = createDueDate(oldBill.attributes.duedate);

    // Look for if the recurring bill was already generated
    // if it was then we don't generate it again
    new BillCollection()
      .query('where', 'reocurring_id', '=', oldBill.attributes.reocurring_id)
      .fetch()
      .then(function(reocurringMade) {
        if (needInstance(reocurringMade, duedate)) {
          var createdate = new Date();
          new BillModel({apartment_id: oldBill.attributes.apartment_id,
            name: oldBill.attributes.name,
            user_id: oldBill.attributes.user_id,
            amount: oldBill.attributes.amount, paid: false,
            interval: oldBill.attributes.interval,
            duedate: duedate, createdate: createdate,
            reocurring_id: oldBill.attributes.reocurring_id})
            .save()
            .then(function(newBill) {

              // Now add new payments for the new bill. They will
              // be the same as the payments for the previous bill
              // except for the bill_id field
              var payments = oldBill.relations.payment.models;
              for (var i = 0; i < payments.length; i++) {
                new PaymentModel({paid: false,
                  amount: payments[i].attributes.amount,
                  user_id: payments[i].attributes.user_id,
                  bill_id: newBill.attributes.id})
                  .save()
                  .otherwise(function() {
                    res.json(503, {error: 'Database error.'});
                  });
                }
                res.send(200);
              }).otherwise(function() {
                res.json(503, {error: 'Database error.'});
              });
            } else {
              res.send(200);
            }
          }).otherwise(function() {
            res.json(503, {error: 'Database error.'});
          });
  },

  // Update the history to reflect an updated payment
  updatePaymentHistory: function(req, billId, apartmentId, paid) {
    Bills.fetchBill(billId, apartmentId,
      function then(billModel) {
        if (paid === 'true') {
          var historyString = req.user.attributes.first_name + ' ' +
            req.user.attributes.last_name + ' paid their portion of bill "' +
            billModel.attributes.name.trim() + '"';
          Bills.saveHistory(historyString, apartmentId,
            function otherwise() {
              res.json(503, {error: 'Database error.'});
            });
        } else {
          var historyString = req.user.attributes.first_name + ' ' +
            req.user.attributes.last_name + ' unpaid their portion of bill "' +
            billModel.attributes.name.trim() + '"';
          Bills.saveHistory(historyString, apartmentId,
            function otherwise() {
              res.json(503, {error: 'Database error.'});
            });
          if (billModel.attributes.paid) {
            historyString = 'The bill "' + billModel.attributes.name.trim() +
              '" is no longer resolved';
            Bills.saveHistory(historyString, apartmentId,
              function otherwise() {
                res.json(503, {error: 'Database error.'});
              });
          }
        }
      });
  }

};

module.exports = Bills;
