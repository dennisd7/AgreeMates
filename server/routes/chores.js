// Chore routes

'use strict';
var ChoreModel = require('../models/chore').model;
var ChoreCollection = require('../models/chore').collection;
var UserChoreModel = require('../models/users_chores').model;
var UserChoreCollection = require('../models/users_chores').collection;
var UserModel = require('../models/user').model;
var Bookshelf = require('bookshelf');
var ChoreDao = require('./choreDao');
var CronJob = require('cron').CronJob;
var HistoryModel = require('../models/history').model;


//Get all chores for an apartment
function getChores(req,res){
    var apartmentId = req.user.attributes.apartment_id;
	
	//Test idea: Check database and see that user is in the apartment?
	
	// Allows to filter completed and not completed chores when complete
	
	 /*if (req.query.type === undefined || (req.query.type !== 'completed' &&
		req.query.type !== 'unresolved')) {
		res.json(400, {error: 'Unexpected type parameter.'});
		return;
	}*/
	Bookshelf.DB.knex('chores')
		.join('users_chores', 'chores.id', '=', 'users_chores.chore_id')
		.join('users', 'users_chores.user_id', '=', 'users.id')
		.where('chores.apartment_id', '=', apartmentId)
		.select( 'chores.interval','chores.createdate',
				'chores.duedate', 'users.first_name','users.last_name',
				'chores.name','chores.reocurring_id',
				'users_chores.user_id', 'users_chores.chore_id',
				'users_chores.order_index', 'chores.completed', 
				'chores.rotating', 'chores.number_in_rotation')
		.orderBy('users_chores.chore_id')
		.then(function(rows){
			var chores = [];
			var users_chores = [];
			if(rows.length === 0){
				res.json({chores: chores});
				return;
			}
			var lastChoreId = -1;
			var name, dueDate, createDate, interval, completed, rotating, number_in_rotation;
			for(var i = 0; i < rows.length; i++){
				//If choreid is differt, then all users_chores for the current
				// chore have been pushed on users_chores. we push the chore then
				if(rows[i].chore_id != lastChoreId){
					if(lastChoreId !== -1){
						chores.push({
							id: lastChoreId,
							name: name,
							createdate: createDate,
							duedate: dueDate,
							interval: interval,
							completed: completed,
							//reocurring_id: chore.reocurring_id,
							//user_id: chore.user_id,
							//apartment_id: chore.apartment_id,
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
				res.json({chores: chores});
		})
		.otherwise(function(error){
			res.json(503, {error: 'Database error.'});
		});
}

  // Process chore form and adds to database

	function addChore(req,res){
		var name = req.body.name;
		var apartmentId = req.user.attributes.apartment_id;
		var userId = req.user.attributes.id;
		var duedate = req.body.duedate;
		var createdate = new Date();

		var interval = req.body.interval;
		var rotating = req.body.rotating;
		var number_in_rotation = req.body.number_in_rotation;
		var roommates = req.body.roommates;
		
		//Check name has valid format
		if(!isValidName(name)){
			res.json(400, {error: 'Invalid chore name.'});
			return;
		}
		// Check valid interval
		if(!isValidInterval(interval)){
			res.json(400, {error: 'Invalid interval.'});
			return;
		}
		
		// Check duedate is valid valid
		if(!isValidDate(duedate)){
			res.json(400, {error: 'Invalid due date'});
			return;
		}
		
		// Check valid roommates ie all in the same apartment
		if(!isValidRoommates(roommates)){
			res.json(400, {error: 'Invalid users assigned to chore'});
			return;
		}
		if(!isInt(number_in_rotation)){
			res.json(400, {error: 'Invalid number in chore rotation'});
			return;
		}
		
		if(rotating && number_in_rotation <= 0){
			res.json(400, {error: 'Invalid number assigned per week'});
			return;
		}
		
		// Check valid number_in_rotation
		if(number_in_rotation > roommates.length){
			res.json(400, {error: 'Invalid number in chore rotation'});
			return;
		}
		
		// If number of people in chore == number in rotation  should be false.
		
		// Call service class here that creates new chore (chore service)
		// choreservice.create(params)
		// returns a response 
		
		
		
		var newChore = {apartment_id: apartmentId,
					name: name.trim(),
					duedate: duedate,
					createdate: createdate,
					user_id: userId,
					completed: false,
					interval: interval,
					rotating: rotating,
					number_in_rotation: number_in_rotation};
		
		ChoreDao.createChore(newChore, roommates, null,
						function(choreModel, userResp){
						var response = {chore: choreModel.attributes, users: userResp};
						if(userResp.length !== roommates.length){
							res.json(503,{error: 'DataBase error'});
						}else{
							new UserModel({id: choreModel.get('user_id')}).
							fetch()
							.then(function(userModel){ 
							
								var historyString = userModel.get('first_name') + ' ' +
								userModel.get('last_name')+ ' created chore ' + choreModel.get('name');
								
								new HistoryModel({apartment_id: choreModel.get('apartment_id'),
													history_string: historyString,
													date: new Date()})
													.save()
													.then(function(){})
													.otherwise(function(error){console.log(error)});
							});
							res.send(200, response);
						}
						}, function(){
						res.json(503,{error: 'DataBaser error'});
						});
		
  } 

  // Marks a chore as  completed and if it is reoccuring creates a new chore
  // Need to check that chore is not already complete
  function completeChore(req, res){
	var choreId = req.params.chore;
	var apartmentId = req.user.attributes.apartment_id;
	var user = req.user.attributes.id;
	
	// Check apartment, user and chore are associated with the same apartment.
	
	
	new ChoreModel({apartment_id: apartmentId, id: choreId})
	.fetch()
	.then(function(chore){
		// If the chore is not reoccuring mark as completed and send 200
		if(chore.interval === 0){
			new ChoreModel({id: choreId})
			.save({completed: true}, {patch: true})
			.then(function(){
				var historyString = req.user.attributes.first_name + ' ' +
								req.user.attributes.last_name+ ' edited chore ' + chore.get('name');
								
				new HistoryModel({apartment_id: chore.get('apartment_id'),
								history_string: historyString,
								date: new Date()})
								.save()
								.then(function(){})
								.otherwise(function(){
								console.log('hisory not recorded');
								});
			});
		}else{
		
		var newChore = {apartment_id: chore.get('apartment_id'),
					name: chore.get('name'),
					duedate: chore.get('duedate'),
					createdate: chore.get('createdate'),
					user_id: user,
					completed: false,
					interval: chore.get('interval'),
					rotating: chore.get('rotating'),
					number_in_rotation: chore.get('number_in_rotation')};
		// If the chore is reoccuring use the same method we have down below
		// with the cron job. In which we create a new chore based upon the chore model info
		//If we have a reocurring_id use that otherwise use the id of our parent.
			newChore.reocurring_id = newChore.reocurring_id || chore.id;
			incrementDate(newChore.duedate, newChore.interval); 
			Bookshelf.DB.knex('users_chores')
			.where('chore_id', '=', chore.get('id'))
			.then(function(users_chores){
				var orderIndex = [];
				var users = [];
				for(var j = 0; j < users_chores.length; j++){
					//Rotating algorithm
					orderIndex[j] = (users_chores[j].order_index - chore.get('number_in_rotation'));
					if(orderIndex[j] < 0){
						orderIndex[j] = orderIndex[j]+users_chores.length;
					}
					users[j] = users_chores[j].user_id;
				}
				ChoreDao.createChore(newChore, users, orderIndex, 
						function(choreModel, userResp){
							var response = {chore: choreModel.attributes, users: userResp};
							if(userResp.length !== users.length){
								res.json(503,{error: 'DataBase error'});
							}else{
								new UserModel({id: choreModel.get('user_id')})
									.fetch()
									.then(function(userModel){ 
								
										var historyString = userModel.get('first_name') + ' ' +
											userModel.get('last_name')+ ' completed chore ' + choreModel.get('name');
											
										new HistoryModel({apartment_id: choreModel.get('apartment_id'),
															history_string: historyString,
															date: new Date()})
															.save()
															.then(function(){})
															.otherwise(function(error){console.log(error)});
									});
								res.send(200, response);
							}
						}, function(){
							console.error('Chore Cron Job: Error creating chore');
						});
			});
		
		}

	}).otherwise(function(){
		res.json(503, {error: 'Database error'});
	})
  
  }
  
  // Update the chore
function editChore(req,res){
	var apartmentId = req.user.attributes.apartment_id;
	var choreId = req.params.chore;
	var name = req.body.name;
	var dueDate = req.body.duedate;
	var roommates = req.body.roommates;
	var interval = req.body.interval;
	

	
	if(!isValidDate(dueDate)){
		res.json(400, {error: 'Invalid due date.'});
		return;
	}
	if(!isValidName(name)){
		res.json(400, {error: 'Invalid chore name.'});
		return;
	}
	
	if(!isValidInterval(interval)){
			res.json(400, {error: 'Invalid interval.'});
			return;
	}
		
	if(!isValidRoommates(roommates)){
		res.json(400,{error: 'Invalid users empty'});
		return;
	}
	
	if(!isInt(choreId)){
		res.json(400,{error: 'Invalid chore id'});
		return;
	}
	//Check that if its aa rotating chore 

	new ChoreModel({apartment_id: apartmentId, id: choreId})
	.save({name: name.trim(), duedate: dueDate, interval: interval},{patch: true})
	.then(function(choreModel) {
	// Go through users_chores assocaited with chore
		new UserChoreModel().query('where', 'chore_id', '=', choreId)
		.destroy()
		.then(function(ucmodel){
			/*Make this a function call*/
			var userChore = [];
					// Build up user to chore mapping to write to the database
					// work around do to model representation not working
					for(var i = 0; i  < roommates.length; i++){
						userChore[i] = new UserChoreModel({
								user_id: roommates[i],
								chore_id: choreModel.id,
								order_index: i
							});
					}
					/*Save away our array of users to new chore
					mapThen :Function to call for each element in the collection
					Collects the return value of all of the function calls into a single response
					then(function(resp)): takes the response built by the mapThen and verify
					that the size of the array is equal to the number of user ids giving in the request.
					*/
					new UserChoreCollection(userChore)
					.mapThen(function(model){
						return model.save()
						.then(function(){
						});
					}).then(function(resp){
						var response = {chore: choreModel.attributes, assignedUsers: resp};
						if(resp.length !== userChore.length){
							res.json(503,{error: 'DataBase error'});
						}else{
							var historyString = req.user.attributes.first_name + ' ' +
								req.user.attributes.last_name+ ' edited chore ' + choreModel.get('name');
								
							new HistoryModel({apartment_id: choreModel.get('apartment_id'),
												history_string: historyString,
												date: new Date()})
												.save()
												.then(function(){})
												.otherwise(function(){
													console.log('hisory not recorded');
												});
							res.send(200);
						}
					})

		}).otherwise(function(){
			res.json(503,{error: 'Database error'});
		});
	})
	.otherwise(function(){
		res.json(400, {error: 'Database error'});
	});
  }

  // Remove chore from database
function deleteChore(req,res){
    var apartmentId = req.user.attributes.apartment_id;

	var choreId = req.params.chore;

	if (!isValidId(choreId)) {
      res.json(400, {error: 'Invalid supply ID.'});
      return;
    }
	var choreName;
	new ChoreModel({id: choreId, apartment_id: apartmentId})
		.fetch()
		.then(function(model){
			new UserChoreModel().query('where', 'chore_id', '=', choreId)
				.destroy()
				.then(function(choremodel){
					new ChoreModel({id: choreId, apartment_id: apartmentId})
					.destroy()
					.then(function(){
						var historyString = req.user.attributes.first_name + ' ' +
							req.user.attributes.last_name + ' deleted chore ' + model.get('name');
								
							new HistoryModel({apartment_id: model.get('apartment_id'),
												history_string: historyString,
												date: new Date()})
												.save()
												.then(function(){})
												.otherwise(function(error){console.log(error)});
						res.send(200);
					}).otherwise(function() {
						res.json(503, {error: 'Database error'});
					});
				}).otherwise(function() {
					res.json(503, {error: 'Database error'})
				});
		});
  }
  
  				   //Sec, min, hours, day of month, months, day of week
				   // Set the cron job to 11:59 PM
var job = new CronJob('0 59 23 * * *', function(){
	var startDate = new Date();
	startDate.setHours(0);
	startDate.setMinutes(0);
	startDate.setSeconds(0);
	startDate.setMilliseconds(0);
	var endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
	endDate.setDate(endDate.getDate()+1);
	// Get all chores with duedate on same day
	Bookshelf.DB.knex('chores')
	.where('chores.duedate', '>=', startDate)
	.andWhere('chores.duedate', '<', endDate)
	.andWhere('chores.interval', '>', 0)
	.andWhere('chores.completed', '=', false)
	.then(function(resp){
		// Find users associated with the chore
		// Update the duedate
		// update the order_index of each user
		// Create chore
		resp.forEach(function(chore){ 
			//If we have a reocurring_id use that otherwise use the id of our parent.
			chore.reocurring_id = chore.reocurring_id || chore.id;
			incrementDate(chore.duedate, chore.interval); 
			Bookshelf.DB.knex('users_chores')
			.where('chore_id', '=', chore.id)
			.then(function(users_chores){
				var orderIndex = [];
				var users = [];
				for(var j = 0; j < users_chores.length; j++){
					//Rotating algorithm
					orderIndex[j] = (users_chores[j].order_index - chore.number_in_rotation);
					if(orderIndex[j] < 0){
						orderIndex[j] = orderIndex[j]+users_chores.length;
					}
					users[j] = users_chores[j].user_id;
				}
				ChoreDao.createChore(chore, users, orderIndex, function(){
				}, function(){
					console.error('Chore Cron Job: Error creating chore');
				});
			});
		
		});
	}).otherwise(function(error){
		console.error('Chore Cron Job: Error looking up chores');
	});
  }, function () {
    // This function is executed when the job stops
  },
  true, /* Start the job right now */
  null /* Time zone of this job. */
);
 
	  //Checks if a chore name is valid
	  function isValidName(name) {
		return name !== undefined && name !== null && name !== '';
	  }

	  //Checks if the user is logged in
	  function checkLogin(req,res,next){
			if (req.user === undefined) {
				res.json(401, {error: 'Unauthorized user.'});
				return;
		}
		next();
	  }
	  
	  // Check that if rotating then interval must be >0
	  function rotateHasInterval(rotating, interval){
			return (rotating && interval > 0) || (!rotating && interval >=0);
	  }
	  
	  // Checks if a chore ID is valid
	  function isValidId(id) {
		return isInt(id) && id > 0;
	  }
	  
	  //Checks that roommates has one user id
	  function isValidRoommates(roommates){
		return roommates !== undefined&&roommates.length > 0;
	  }
	  
	  //Checks that interval is a valid integer
	  function isValidInterval(interval){
		return isInt(interval) && interval >=0;
	  }
	  
	  function isInt(value) {
		/* jshint eqeqeq: false */
		return !isNaN(value) && parseInt(value) == value;
	  }
	  
	  //Checks that date is on or after current date.
	  function isValidDate(date){
		var currentDate = new Date();
		currentDate.setHours(0);
		currentDate.setMinutes(0);
		currentDate.setSeconds(0);
		currentDate.setMilliseconds(0);
		date = new Date(date);
		return date >= currentDate;
	  }
	  //increment date by interval days
	  function incrementDate(dat, days) {
		return dat.setDate(dat.getDate() + days);
	}

function setup(app){
	 app.get('/chores', checkLogin,getChores);
	 app.post('/chores', checkLogin,addChore);
	 app.post('/chores/complete/:chore', checkLogin, completeChore);
	 app.put('/chores/:chore', checkLogin,editChore);
	  app.delete('/chores/:chore', checkLogin, deleteChore);
 }
 
module.exports.getChores = getChores;
module.exports.addChore = addChore;
module.exports.completeChore = completeChore;
module.exports.editChore = editChore;
module.exports.deleteChore = deleteChore;
module.exports.setup = setup;
module.exports.checkLogin = checkLogin;
