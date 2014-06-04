// Chore routes
'use strict';
var ChoreModel = require('../models/chore').model;
var UserChoreModel = require('../models/users_chores').model;
var UserChoreCollection = require('../models/users_chores').collection;
var UserModel = require('../models/user').model;
var Bookshelf = require('bookshelf');
var HistoryModel = require('../models/history').model;

// Check if a int is valid
function isInt(value) {
  /* jshint eqeqeq: false */
  return !isNaN(value) && parseInt(value) == value;
}
// Checks if a chore name is valid
function isValidName(name) {
  return name !== undefined && name !== null && name !== '';
}

// Checks if a chore ID is valid
function isValidId(id) {
  return isInt(id) && id > 0;
}

//Checks that roommates has one user id
function isValidRoommates(roommates) {
  return roommates !== undefined && roommates.length > 0;
}

//Checks that interval is a valid integer
function isValidInterval(interval) {
  return isInt(interval) && interval >= 0;
}

//Checks that date is on or after current date.
// Note this only works for yyyy-mm-dd format of date
function isValidDate(date) {
  var currentDate = new Date();
  currentDate.setHours(0);
  currentDate.setMinutes(0);
  currentDate.setSeconds(0);
  currentDate.setMilliseconds(0);
  return date >= currentDate;
}
//increment date by interval days
function incrementDate(dat, days) {
  return dat.setDate(dat.getDate() + days);
}

var Chores = {

  //Get all chores for an apartment
  getChores: function (req, res) {
    var apartmentId = req.user.attributes.apartment_id;


    // Allows to filter completed and not completed chores when complete
    Chores.fetchChores(apartmentId,
      function then(rows) {
        var chores = [];
        var users_chores = [];
        if (rows.length === 0) {
          res.json({
            chores: chores
          });
          return;
        }
        var lastChoreId = -1;
        var name, dueDate, createDate, interval,
		  completed, rotating, number_in_rotation;
        for (var i = 0; i < rows.length; i++) {
          // If choreid is differt, then all users_chores for the current
          // chore have been pushed on users_chores. we push the chore then
          if (rows[i].chore_id !== lastChoreId) {
            if (lastChoreId !== -1) {
              chores.push({
                id: lastChoreId,
                name: name,
                createdate: createDate,
                duedate: dueDate,
                interval: interval,
                completed: completed,
                users: users_chores,
                number_in_rotation: number_in_rotation,
                rotating: rotating
              });
            }
            //empty users_chores
            users_chores = [];
            lastChoreId = rows[i].chore_id;
            name = rows[i].name;
            createDate = rows[i].createdate;
            dueDate = rows[i].duedate;
            interval = rows[i].interval;
            completed = rows[i].completed;
            rotating = rows[i].rotating;
            number_in_rotation = rows[i].number_in_rotation;
          }

          users_chores.push({
            user_id: rows[i].user_id,
            first_name: rows[i].first_name,
            last_name: rows[i].last_name,
            order_index: rows[i].order_index
          });
        }
        chores.push({
          id: lastChoreId,
          name: name,
          createdate: createDate,
          duedate: dueDate,
          interval: interval,
          completed: completed,
          users: users_chores,
          number_in_rotation: number_in_rotation,
          rotating: rotating
        });
        res.json({
          chores: chores
        });
      }, function error() {
        res.json(503, {
          error: 'Database error.'
        });
      });
  },

  // Process chore form and adds to database
  addChore: function (req, res) {
    var name = req.body.name;
	name = name;
    var apartmentId = req.user.attributes.apartment_id;
    var userId = req.user.attributes.id;
    var dueDate = new Date(req.body.duedate);
    var createDate = new Date();

    var interval = req.body.interval;
    var rotating = req.body.rotating;
    var number_in_rotation = req.body.number_in_rotation;
    var roommates = req.body.roommates;

    //Check name has valid format
    if (!isValidName(name)) {
      res.json(400, {
        error: 'Invalid chore name.'
      });
      return;
    }
    // Check valid interval
    if (!isValidInterval(interval)) {
      res.json(400, {
        error: 'Invalid interval.'
      });
      return;
    }

    // Check duedate is valid valid
    if (!isValidDate(dueDate)) {
      res.json(400, {
        error: 'Invalid due date.'
      });
      return;
    }

    // Check valid roommates ie all in the same apartment
    if (!isValidRoommates(roommates)) {
      res.json(400, {
        error: 'Invalid users assigned to chore.'
      });
      return;
    }
    if (!isInt(number_in_rotation)) {
      res.json(400, {
        error: 'Invalid number in chore rotation.'
      });
      return;
    }

    if (rotating && number_in_rotation <= 0) {
      res.json(400, {
        error: 'Invalid number assigned per week.'
      });
      return;
    }

    // Check valid number_in_rotation
    if (number_in_rotation > roommates.length) {
      res.json(400, {
        error: 'Invalid number in chore rotation.'
      });
      return;
    }

    var newChore = {
      apartment_id: apartmentId,
      name: name.trim(),
      duedate: dueDate,
      createdate: createDate,
      user_id: userId,
      completed: false,
      interval: interval,
      rotating: rotating,
      number_in_rotation: number_in_rotation
    };

    Chores.createChore(newChore, roommates, null,
      function (choreModel, userResp) {
        var response = {
          chore: choreModel.attributes,
          users: userResp
        };
        if (userResp.length !== roommates.length) {
          res.json(503, {
            error: 'Database error.'
          });
        } else {
          var historyString = req.user.attributes.first_name + ' ' +
            req.user.attributes.last_name + ' added chore '	+
			  choreModel.get('name');

          Chores.addHistory(choreModel, historyString,
            function then() {
              res.json(response);
            },
            function otherwise() {
              res.json(503, {
                error: 'Database error.'
              });
            });
        }
      }, function () {
        res.json(503, {
          error: 'Database error.'
        });
      });

  },

  // Marks a chore as  completed and if it is reocurring creates a new chore
  completeChore: function (req, res) {
    var choreId = req.body.id;
    var apartmentId = req.body.apartment_id;
    var user = req.body.user_id;

    if (!isValidId(choreId)) {
      res.json(400, {
        error: 'Invalid chore ID.'
      });
      return;
    }

    // Check that the chore being marked as completed
    Chores.fetchChore(apartmentId, choreId,
      function then(chore) {
        // If the chore is not reocurring mark as completed and send 200
        if (!chore.get('completed')) {
          Chores.markChoreComplete(choreId,
            function then() {
              //One time chore	or		reocurring chore past duedate
              if (chore.get('interval') === 0 ||
			    (!isValidDate(chore.get('duedate')))) {
                var historyString = req.user.attributes.first_name + ' ' +
                  req.user.attributes.last_name + ' completed chore ' +
				    chore.get('name');

                Chores.addHistory(chore, historyString,
                  function then() {
                    res.send(200);
                  },
                  function otherwise() {
                    res.json(503, {
                      error: 'Database error.'
                    });
                  });

				   // Need to create the next chore in the reocurring cycle
              } else if (isValidDate(chore.get('duedate'))) {
                var newChore = {
                  apartment_id: chore.get('apartment_id'),
                  name: chore.get('name'),
                  duedate: chore.get('duedate'),
                  createdate: chore.get('createdate'),
                  user_id: user,
                  completed: false,
                  interval: chore.get('interval'),
                  rotating: chore.get('rotating'),
                  number_in_rotation: chore.get('number_in_rotation')
                };
                // If chore is reoccuring create a new chore based upon the chore model info
                // If we have a reocurring_id use that otherwise use the id of our parent.
                newChore.reocurring_id = newChore.reocurring_id || chore.id;
                incrementDate(newChore.duedate, newChore.interval);
                Chores.fetchAssignedUsers(chore,
                  function then(users_chores) {
                    var orderIndex = [];
                    var users = [];
                    for (var j = 0; j < users_chores.length; j++) {
                      //Rotating algorithm
                      orderIndex[j] = (users_chores[j].order_index -
					    chore.get('number_in_rotation'));
                      if (orderIndex[j] < 0) {
                        orderIndex[j] = orderIndex[j] + users_chores.length;
                      }
                      users[j] = users_chores[j].user_id;
                    }
                    Chores.createChore(newChore, users, orderIndex,
                      function (choreModel, userResp) {
                        var response = {
                          chore: choreModel.attributes,
                          users: userResp
                        };
                        if (userResp.length !== users.length) {
                          res.json(503, {
                            error: 'Database error.'
                          });
                        } else {
                          var historyString = req.user.attributes.first_name + ' ' +
                            req.user.attributes.last_name + ' completed chore ' +
							  choreModel.get('name');

                          Chores.addHistory(choreModel, historyString,
                            function then() {
                              res.json(response);
                            },
                            function otherwise() {
                              res.json(503, {
                                error: 'Database error.'
                              });
                            });
                        }
                      },
                      function otherwise() {
                        res.json(503, {
                          error: 'Database error.'
                        });
                      });
                  },
                  function otherwise() {
                    res.json(503, {
                      error: 'Database error.'
                    });
                  });
              }
            },
            function otherwise() {
              res.json(503, {
                error: 'Database error.'
              });
            });
        } else {
          res.json(400, {
            error: 'Chore is already complete.'
          });
        }
      },
      function otherwise() {
        res.json(503, {
          error: 'Database error.'
        });
      }
    );

  },

  // Update the chore
  editChore: function (req, res) {
    var apartmentId = req.user.attributes.apartment_id;
    var choreId = req.params.chore;
    var name = req.body.name;
    var dueDate = new Date(req.body.duedate);
    var roommates = req.body.roommates;
    var interval = req.body.interval;
    var rotating = req.body.rotating;
    var number_in_rotation = req.body.number_in_rotation;
    //Check name has valid format
    if (!isValidName(name)) {
      res.json(400, {
        error: 'Invalid chore name.'
      });
      return;
    }

    // Check valid interval
    if (!isValidInterval(interval)) {
      res.json(400, {
        error: 'Invalid interval.'
      });
      return;
    }

    // Check duedate is valid valid
    if (!isValidDate(dueDate)) {
      res.json(400, {
        error: 'Invalid due date.'
      });
      return;
    }

    // Check valid roommates ie all in the same apartment
    if (!isValidRoommates(roommates)) {
      res.json(400, {
        error: 'Invalid users assigned to chore.'
      });
      return;
    }
    if (!isInt(number_in_rotation)) {
      res.json(400, {
        error: 'Invalid number in chore rotation.'
      });
      return;
    }

    if (rotating && number_in_rotation <= 0) {
      res.json(400, {
        error: 'Invalid number assigned per week.'
      });
      return;
    }

    // Check valid number_in_rotation
    if (number_in_rotation > roommates.length) {
      res.json(400, {
        error: 'Invalid number in chore rotation.'
      });
      return;
    }

    if (!isInt(choreId)) {
      res.json(400, {
        error: 'Invalid chore id.'
      });
      return;
    }

    var newChore = {
      apartment_id: apartmentId,
      name: name.trim(),
      id: choreId,
      duedate: dueDate,
      completed: false,
      interval: interval,
      rotating: rotating,
      number_in_rotation: number_in_rotation
    };

    Chores.patchChore(newChore,
      function then(choreModel) {
        // Go through users_chores assocaited with chore
        Chores.unassignUsers(choreModel.id, function then() {
            var userChore = [];
            // Build up user to chore mapping to write to the database
            // work around do to model representation not working
            for (var i = 0; i < roommates.length; i++) {
              userChore[i] = new UserChoreModel({
                user_id: roommates[i],
                chore_id: choreModel.id,
                order_index: i
              });
            }
            Chores.assignUsers(userChore,
              function then(resp) {
                if (resp.length !== userChore.length) {
                  res.json(503, {
                    error: 'DataBase error.'
                  });
                } else {
                  var historyString = req.user.attributes.first_name + ' ' +
                    req.user.attributes.last_name + ' edited chore ' +
					  choreModel.get('name');
                  Chores.addHistory(choreModel, historyString,
                    function then() {
                      res.send(200);
                    },
                    function otherwise() {
                      res.json(503, {
                        error: 'Database error.'
                      });
                    });
                }
              },
              function otherwise() {
                res.json(503, {
                  error: 'Database error.'
                });
              }
            );

          },
          function otherwise() {
            res.json(503, {
              error: 'Database error.'
            });
          });
      },
      function otherwise() {
        res.json(503, {
          error: 'Database error.'
        });
      });
  },


  // Remove chore from database
  deleteChore: function (req, res) {
    var apartmentId = req.user.attributes.apartment_id;

    var choreId = req.params.chore;

    if (!isValidId(choreId)) {
      res.json(400, {
        error: 'Invalid chore ID.'
      });
      return;
    }
    Chores.fetchChore(apartmentId, choreId,
      function then(choreModel) {
        Chores.unassignUsers(choreId,
          function then() {
            Chores.removeChore(apartmentId, choreId,
              function then() {

                var historyString = req.user.attributes.first_name + ' ' +
                  req.user.attributes.last_name + ' deleted chore ' +
				    choreModel.get('name');
                Chores.addHistory(choreModel, historyString,
                  function then() {
                    res.send(200);
                  },
                  function otherwise() {
                    res.json(503, {
                      error: 'Database error.'
                    });
                  });
              },
              function otherwise() {
                res.json(503, {
                  error: 'Database error.'
                });
              });
          },
          function otherwise() {
            res.json(503, {
              error: 'Database error.'
            });
          });
      },
      function otherwise() {
        res.json(503, {
          error: 'Database error.'
        });
      });
  },

  fetchChores: function (apartmentId, success, error) {
    Bookshelf.DB.knex('chores')
      .join('users_chores', 'chores.id', '=', 'users_chores.chore_id')
      .join('users', 'users_chores.user_id', '=', 'users.id')
      .where('chores.apartment_id', '=', apartmentId)
      .select('chores.interval', 'chores.createdate',
        'chores.duedate', 'users.first_name', 'users.last_name',
        'chores.name', 'chores.reocurring_id',
        'users_chores.user_id', 'users_chores.chore_id',
        'users_chores.order_index', 'chores.completed',
        'chores.rotating', 'chores.number_in_rotation')
      .orderBy('users_chores.chore_id')
      .then(success)
      .otherwise(error);
  },
  setup: function (app) {
    app.get('/chores', Chores.checkLogin, Chores.getChores);
    app.post('/chores', Chores.checkLogin, Chores.addChore);
    app.post('/chores/complete/:chore', Chores.checkLogin, Chores.completeChore);
    app.put('/chores/:chore', Chores.checkLogin, Chores.editChore);
    app.delete('/chores/:chore', Chores.checkLogin, Chores.deleteChore);
  },
  //Checks if the user is logged in
  checkLogin: function (req, res, next) {
    if (req.user === undefined) {
      res.json(401, {
        error: 'Unauthorized user.'
      });
      return;
    }
    next();
  },
  patchChore: function (chore, success, error) {
    new ChoreModel({
      apartment_id: chore.apartment_id,
      id: chore.id
    })
      .save({
        name: chore.name,
        duedate: chore.duedate,
        interval: chore.interval,
        number_in_rotation: chore.number_in_rotation,
        rotating: chore.rotating
      }, {
        patch: true
      })
      .then(success)
      .otherwise(error);
  },

  addHistory: function (choreModel, historyString, success, error) {
    new HistoryModel({
      apartment_id: choreModel.get('apartment_id'),
      history_string: historyString,
      date: new Date()
    })
      .save()
      .then(success)
      .otherwise(error);
  },
  unassignUsers: function (choreId, success, error) {
    new UserChoreModel().query('where', 'chore_id', '=', choreId)
      .destroy()
      .then(success)
      .otherwise(error);
  },

  removeChore: function (apartmentId, choreId, success, error) {
    new ChoreModel({
      apartment_id: apartmentId,
      id: choreId
    })
      .destroy()
      .then(success)
      .otherwise(error);
  },

  assignUsers: function (userChore, success, error) {
    new UserChoreCollection(userChore)
      .mapThen(function (model) {
        return model.save()
          .then(function () {});
      })
      .then(success)
      .otherwise(error);
  },
  fetchAssignedUsers: function (chore, success, error) {
    Bookshelf.DB.knex('users_chores')
      .where('chore_id', '=', chore.get('id'))
      .then(success)
      .otherwise(error);
  },
  markChoreComplete: function (choreId, success, error) {
    new ChoreModel({
      id: choreId
    })
      .save({
        completed: true
      }, {
        patch: true
      })
      .then(success)
      .otherwise(error);
  },

  fetchChore: function (apartmentId, choreId, success, error) {
    new ChoreModel({
      apartment_id: apartmentId,
      id: choreId
    })
      .fetch()
      .then(success)
      .otherwise(error);
  },
  createChore: function (chore, users, orderIndex, success, error) {
    new ChoreModel({
      apartment_id: chore.apartment_id,
      name: chore.name.trim(),
      duedate: chore.duedate,
      createdate: chore.createdate,
      user_id: chore.user_id,
      completed: chore.completed,
      interval: chore.interval,
      rotating: chore.rotating,
      number_in_rotation: chore.number_in_rotation,
      reocurring_id: chore.reocurring_id || 0
    })
      .save()
      .then(function (choreModel) {
        var userChore = [];
        // Build up user to chore mapping to write to the database
        // work around do to model representation not working
        for (var i = 0; i < users.length; i++) {
          var order = i;
          if (orderIndex) {
            order = orderIndex[i];
          }
          userChore[i] = new UserChoreModel({
            user_id: users[i],
            chore_id: choreModel.id,
            order_index: order
          });

        }
        /*Save away our array of users to new chore
		  mapThen :Function to call for each element in the collection
		  Collects the return value of all of the function calls into a single response
		  then(function(resp)): takes the response built by the mapThen and verify
		  that the size of the array is equal to the number of user ids giving in the request.
		*/
        new UserChoreCollection(userChore)
          .mapThen(function (model) {
            return model.save()
              .then(function () {
                return new UserModel({
                    id: model.get('user_id')
                  })
                  .fetch()
                  .then(function (userM) {
                    return Chores.modelToUser(userM, model.get('order_index'));
                  });
              });
          }).then(function (resp) {
            if (success) {
              success(choreModel, resp);
            }
          });

      }).otherwise(function () {
        error();
      });
  },
  modelToUser: function (userModel, order_index) {
    return {
      user_id: userModel.get('id'),
      first_name: userModel.get('first_name'),
      last_name: userModel.get('last_name'),
      order_index: order_index
    };
  }

};


module.exports = Chores;
