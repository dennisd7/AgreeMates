var ChoreModel = require('../models/chore').model;
var ChoreCollection = require('../models/chore').collection;
var UserChoreModel = require('../models/users_chores').model;
var UserChoreCollection = require('../models/users_chores').collection;
var UserModel = require('../models/user').model;
var Bookshelf = require('bookshelf'); 

	 function modelToUser(userModel, order_index){
		return {user_id: userModel.get('id'), first_name: userModel.get('first_name'),
				last_name: userModel.get('last_name'), order_index: order_index};
	 }
 
exports.createChore =	function(chore, users, orderIndex, success, error){
	new ChoreModel({apartment_id: chore.apartment_id,
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
					.then(function(choreModel){
					var userChore = [];
					// Build up user to chore mapping to write to the database
					// work around do to model representation not working
					for(var i = 0; i  < users.length; i++){
						var order = i;
						if(orderIndex){
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
					.mapThen(function(model){				
						return model.save()
						.then(function(){
							return new UserModel({id: model.get('user_id')})
							.fetch()
							.then(function(userM){
								return modelToUser(userM, model.get('order_index'));
							});
						});
					}).then(function(resp){
						if(success){
							success(choreModel,resp);
						}
					});
					
					}).otherwise(function(){
						error();
				});
	}