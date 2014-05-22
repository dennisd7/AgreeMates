// Chores front end controller

'use strict';

angular.module('main.chores', ['ui.bootstrap', 'ui.sortable']);

angular.module('main.chores').controller('ChoresCtrl',

function ($scope, $http, $timeout) {

    $scope.menuEmpty = function(){
        return $scope.menuList.length == 0;
    };

    $scope.responsibleEmpty = function() {
        return $scope.responsibleList.length == 0;
    };

    $scope.users_at_least_two = function() {
        console.log($scope.responsibleList.length);
        if($scope.responsibleList.length < 2 || parseInt($scope.chore.interval) == 0)
        {
            return true;
        }
        else
        {
            return false;
        }

    };

    $scope.users_and_rotating = function()
    {
        if($scope.responsibleList.length > 1 && $scope.chore.rotating == true)
        {
            return false;
        }
        else
        {
            return true;
        }

    };

    $scope.populate_rotation = function(){
        $scope.rotation_number = [];
        for(var i = 1; i < $scope.responsibleList.length; i++)
        {
            $scope.rotation_number[(i - 1)] = i;
        }
    };

    $scope.menuList = {};
    $scope.responsibleList = [];
    $scope.sortableOptions = {
        connectWith: '.connectedList1',
        placeholder: 'placeholder',
        dropOnEmpty: true
    };
    $scope.table = '';

    var alertLength = 4000;

    $scope.gindex = 0;
    $scope.modal_message = {starts: "Start", due: "Due"};
    $scope.modal_msg = $scope.modal_message.due;
    $scope.chore = {name: '', rotating: false};
    $scope.chores = [];
    $scope.weekly = [];
    $scope.users = [];

    $scope.rotation_number = [];

  function setModal(interval) {
    if (interval == 0) {
      $scope.modal_msg = $scope.modal_message.due;
    } else {
      $scope.modal_msg = $scope.modal_message.starts;
    }
  }

  $http.get('/chores')
    .success(function(data) {
      $scope.chores = data.chores;
      for (var x = 0; x < $scope.chores.length; x++) {
        for (var i = 0; i < $scope.chores[x].users[i].length; i++) {
          $scope.chores[x].users[i].user_id = $scope.chores[x].users[i].id;
        }
      }
    })
    .error(function() {});

  $http.get('/apartment/users')
    .success(function(data) {
      $scope.users = data.users;
    }).error(function() {});

  $scope.addChore = function() {
    var chore = angular.copy($scope.chore);
    chore.roommates = [];
    chore.interval = parseInt(chore.interval);
    chore.rotating = false;
    var any = {name: '', id: 0};
    //var at_least_one_user = 0;

    // checks to see that at lesat one user is checked

    if (!chore.duedate) {
      showErr("Please select a valid date.");
    } else {
        console.log(at_least_one_user());
        if (!at_least_one_user()) {
        showErr("Please select at least one roommate.");
        } 
        else {
            for (var i = 0; i < $scope.responsibleList.length; i++)
            {
          
            any.id = $scope.responsibleList[i].id;
            chore.roommates.push(any.id);
            }
            console.log(chore);
            $http.post('/chores', chore)
            .success(function(data) {
            chore = data.chore;
            chore.users = [];
            chore.users = data.users;

            $scope.chores.push(chore);

            showSucc("Chore "+chore.name+" successfully added!");
            }).error(function() {});
      }
    }

    $scope.cancel;
  };

  $scope.editChore = function(index) {
    $scope.chore.roommates = [];
    var temp = [];
    var at_least_one_user = 0;

    for (var x = 0; x < $scope.users.length; x++) {
      if ($scope.users[x].isChecked) {
        at_least_one_user = at_least_one_user + 1;
      }
    }

    if (!$scope.chore.duedate) {
      showErr("Please select a valid date.");
    } else {
      if (at_least_one_user == 0) {
        showErr("Please select at least one roommate.");
      } else {
        for (var i = 0; i < $scope.users.length; i++) {
          if ($scope.users[i].isChecked) {
            $scope.chore.roommates.unshift($scope.users[i].id);
          } else {
            $scope.chore.users = $scope.chore.users.filter(function(user) {
              return !($scope.users[i].id == user.user_id);
            });
          }
      }

      for (var i = 0; i < $scope.users.length; i++) {
        if ($scope.users[i].isChecked) {
          temp.push($scope.users[i]);
        }
      }

      $scope.chore.users = temp;
      $scope.chore.interval = parseInt($scope.chore.interval);

      $http.put('/chores/' + $scope.chore.id, $scope.chore)
        .success(function(data) {
          showSucc("Chore " + $scope.chore.name + " successfully edited!");
          var useless = {};
          for (var i = 0; i < $scope.chore.users.length; i++) {
            $scope.chore.users[i].user_id = $scope.chore.users[i].id;
            useless = $scope.chore.users.filter(function(user) {
              return user.id == data[i].user_id;
            });
            useless[0].order_index = data[i].order_index;
          }
          $scope.chores[$scope.gindex] = angular.copy($scope.chore);
        })
        .error(function() {});
      }
    }

    $scope.cancel;
  };

  $scope.deleteChore = function(id, index) {
    	$http.delete('/chores/' + id)
  	    .success(function(data) {
  	       $scope.chores.splice(index, 1);
  	     })
         .error(function() {});
  };

  $scope.cancel = function() {
    $scope.chore.name = '';
    $scope.chore.duedate = null;
    for (var i = 0; i < $scope.users.length; i++) {
      $scope.users[i].isChecked = false;
    }
  };

  $scope.setChore = function(index){
    $scope.gindex = index;
    var chore = angular.copy($scope.chores[index]);
    chore.duedate = $scope.convertdate(chore.duedate);

    // set everything to false
    for (var i = 0; i < $scope.users.length; i++) {
      $scope.users[i].isChecked = false;
    }
    var temp2 = {};

    // finds all users that are in the chore.users field and checkes them in $scope.users
    for (var i = 0; i < chore.users.length; i++) {
      temp2 = $scope.users.filter(function(user) {
        return user.id == chore.users[i].user_id;
      });
      temp2.map(function(user) {
        user.isChecked = true;
      });
    }

    $scope.chore = chore;
  };

  function showSucc(msg) {
    $scope.successmsg = msg;
    $scope.success = true;
    $timeout(function(){$scope.success=false;},alertLength);
  }

  function showErr(msg){
    $scope.errormsg = msg;
    $scope.error = true;
    $timeout(function(){$scope.error=false;},alertLength);
  }

  function at_least_one_user() {
    console.log($scope.responsibleList);
      if ($scope.responsibleList.length == 0) 
      {
        return false;
      }
      else
      {
        return true;
      }
  }

  $scope.convertdate = function(date) {
    var x = date.split("T");
    return x[0];
  };

  $scope.convertfrequency = function(freq) {
    if (freq == 0) {
      return "One Time";
    } else {
      return "Weekly";
    }
  };

  $scope.setModal = function(interval) {
    if (interval == 0) {
      return "Due";
    } else {
      return "Starting Due";
    }
  };

  $scope.isResponsible = function(chore, user) {
    if (chore.interval == 0) {
      return "highlight";
    } else {
      return user.order_index == 0;
    }
  };

  $scope.emptyChoreList = function() {
    return $scope.chores.length == 0 ? true : false;
  };

  $scope.format = function(date) {
    return moment(date).format('MMMM Do, YYYY');
  };

  $scope.setList = function() {
    $scope.menuList = angular.copy ($scope.users);
  }
  $scope.reset_responsibleList = function(){
    $scope.responsibleList = [];
  }

    //select unresolved bills or resolved bills
    $scope.setTable = function(table) {
        if (table == 'resolved') {
            
        $scope.table = 'resolved';
        } else {
            
        $scope.table = 'unresolved';
        }       
    };


});
