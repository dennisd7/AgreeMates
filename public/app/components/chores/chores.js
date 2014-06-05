// Chores front end controller

'use strict';

angular.module('main.chores', ['ui.bootstrap', 'ui.sortable']);

angular.module('main.chores').controller('ChoresCtrl',
  function ($scope, $http, $timeout) {

    //get request didn't return yet
    $scope.loaded = false;

    //variables to control the connected list menu
    $scope.menuList = {};
    $scope.responsibleList = [];

    //variables for connected list
    $scope.sortableOptions = {
      connectWith: '.connectedList1',
      placeholder: 'placeholder',
      dropOnEmpty: true
    };
    //variable to control completed/uncompleted bills
    $scope.table = '';
    //error message length
    var alertLength = 4000;

    $scope.gindex = 0;

    //dynamic update for weekly one-time UI
    $scope.modal_message = {starts: 'Start', due: 'Due'};
    $scope.modal_msg = $scope.modal_message.due;

    //initial values for global variables
    $scope.chore = {name: '', rotating: false};

    $scope.chores = [];
    $scope.chores_uncompleted =[];
    $scope.chores_completed = [];
    $scope.weekly = [];
    $scope.users = [];
    $scope.userId = {};
    $scope.userFirstName = {};
    $scope.userLastName = {};
    $scope.apartment = {};
    $scope.currUser = {};
    $scope.rotation_number = [];


    function setModal(interval) {
      if (interval == 0) {
        $scope.modal_msg = $scope.modal_message.due;
      } else {
        $scope.modal_msg = $scope.modal_message.starts;
      }
    }

    //get current user ID and name
    $http.get('/user')
      .success(function(data) {
        $scope.currUser = data;
        $scope.userId = data.id;
        $scope.userFirstName = data.first_name;
        $scope.userLastName = data.last_name;
      })
      .error(function(error) {
        console.log(error);
      });

    $http.get('/chores')
      .success(function(data) {
        for (var x = 0; x < $scope.chores.length; x++) {
          for (var i = 0; i < $scope.chores[x].users[i].length; i++) {
            $scope.chores[x].users[i].user_id = $scope.chores[x].users[i].id;
          }
        }

        for (var x = 0; x < data.chores.length; x++) {
          if (data.chores[x].completed == true) {
            $scope.chores_completed.unshift(data.chores[x]);
          } else {
            $scope.chores_uncompleted.unshift(data.chores[x]);
          }
        }

        $scope.chores = $scope.chores_uncompleted;
        $scope.table = 'unresolved';

        $scope.loaded = true;
        $('table.hide').removeClass('hide');
      })
      .error(function(error) {
        $scope.chores = $scope.chores_uncompleted;
        $scope.table = 'unresolved';
        console.log(error);
      });

    $http.get('/apartment/users')
      .success(function(data) {
        $scope.users = data.users;
      }).error(function(error) {
        console.log(error);
      });

    $http.get('/apartment')
      .success(function(data) {
        $scope.apartment = data;
      })
      .error(function(error) {
        console.log(error);
      });

    $scope.addChore = function() {

      var chore = angular.copy($scope.chore);
      chore.roommates = [];
      chore.interval = parseInt(chore.interval);
      chore.number_in_rotation = parseInt(chore.rotation_number);
      if(!chore.number_in_rotation) {
        chore.number_in_rotation = 1;
      }
      chore.apartment_id = $scope.apartment.id;
      chore.userId = $scope.userId;

      var any = {name: '', id: 0};

      // checks to see that at least one user is checked
      if ($scope.chore.name == '' || !$scope.chore.name) {
        showErr('Please input a valid name.');
      } else {
        if (!chore.duedate) {
          showErr('Please select a valid date.');
        } else {
          if (!at_least_one_user()) {
            showErr('Please select at least one roommate.');
          } else {
            for (var i = 0; i < $scope.responsibleList.length; i++) {
              any.id = $scope.responsibleList[i].id;
              chore.roommates.push(any.id);
            }
            //fix heroku time zone bug
            //chore.duedate = convert_to_EST(chore.duedate);
            console.log(chore.duedate);

            $http.post('/chores', chore)
              .success(function(data) {
                chore = data.chore;
                chore.users = [];
                chore.users = data.users;

                $scope.chores_uncompleted.push(chore);

                showSucc('Chore '+chore.name+' successfully added!');
              }).error(function(error) {
                console.log(error);
              });
          }
        }
      }
      $scope.cancel;
    };

    $scope.editChore = function() {
      //$scope.chore.roommates = [];
      var any = {name: '', id: 0};

      if ($scope.chore.name == '' || !$scope.chore.name) {
        showErr('Please input a valid name.');
      } else {
        if (!$scope.chore.duedate) {
          showErr('Please select a valid date.');
        } else {
          if (!at_least_one_user()) {
            showErr('Please select at least one roommate.');
          } else {
            $scope.chore.users = [];

            $scope.chore.users = angular.copy($scope.responsibleList);

            $scope.chore.roommates = [];
            for (var i = 0; i < $scope.responsibleList.length; i++) {
              any.id = $scope.responsibleList[i].id;
              $scope.chore.roommates.push(any.id);
            }

            // $scope.chore.users = temp;
            $scope.chore.interval = parseInt($scope.chore.interval);
            $scope.chore.number_in_rotation = $scope.chore.rotation_number;
            $http.put('/chores/' + $scope.chore.id, $scope.chore)
            .success(function(data) {
              showSucc('Chore ' + $scope.chore.name + ' successfully edited!');

              for(var i = 0; i < $scope.chore.users.length; i++) {
                $scope.chore.users[i].user_id = $scope.chore.users[i].id
                $scope.chore.users[i].order_index = i;
              }
              $scope.chores[$scope.gindex] = angular.copy($scope.chore);
            })
            .error(function() {});

          } //end check at_least_one_user
        } //end check date
      } //end check name
      $scope.cancel;
    };

    $scope.deleteChore = function() {
      $http.delete('/chores/' + $scope.deleteId)
        .success(function(data) {
          showSucc("Chore "+ $scope.chores[$scope.deleteIdx].name+" successfully deleted!");
          $scope.chores.splice($scope.deleteIdx, 1);
        })
        .error(function(error) {
          console.log(error);
        });
    };

    $scope.cancel = function() {
      $scope.chore.name = '';
      $scope.chore.duedate = null;
      for (var i = 0; i < $scope.users.length; i++) {
        $scope.users[i].isChecked = false;
      }
    };

    $scope.setChore = function(index) {
      $scope.gindex = index;
      var chore = angular.copy($scope.chores[index]);
      chore.ind = index;

      $scope.setList();
      $scope.reset_responsibleList();

      var temp = $scope.menuList;
      var temp2 = angular.copy($scope.menuList);

      //set the menu list
      for (var i = 0; i < chore.users.length; i++) {
        temp = temp.filter(function(user){
          return user.id != chore.users[i].user_id;
        });
      }

      $scope.menuList = temp;

      //set the responsible list
      for (var i = 0; i < chore.users.length; i++) {
        $scope.responsibleList.push(temp2.filter(function(user) {
          return user.id == chore.users[i].user_id;})[0]);
      }

      chore.duedate = $scope.convertdate(chore.duedate);
      chore.rotation_number = chore.number_in_rotation;

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
      if ($scope.responsibleList.length == 0) {
          return false;
      } else {
        return true;
      }
    }

    $scope.convertdate = function(date) {
      var x = date.split('T');
      return x[0];
    };

    $scope.convertfrequency = function(freq) {
      if (freq == 0) {
        return 'One Time';
      } else {
        if( freq == 1) {
          return 'Daily';
        } else {
          return 'Weekly';
        }
      }
    };

    $scope.setModal = function(interval) {
      if (interval == 0) {
        return 'Due';
      } else {
        return 'Start';
      }
    };

    $scope.isResponsible = function(chore, user) {
      if (chore.interval == 0) {
        return 'highlight';
      } else {
        if (chore.rotating == false) {
          return 'highlight';
        } else {
          return (user.order_index < chore.number_in_rotation);
        }
      }
    };

    $scope.format = function(date) {
      return moment(date).utc().format('MMMM Do, YYYY');
    };

    $scope.setList = function() {
      $scope.menuList = angular.copy ($scope.users);
    };

    $scope.reset_responsibleList = function(){
      $scope.responsibleList = [];
    };

    //select unresolved chores or resolved chores
    $scope.setTable = function(table) {
      if (table == 'resolved') {
        $scope.chores = $scope.chores_completed;
        $scope.table = 'resolved';
      } else {
        $scope.chores = $scope.chores_uncompleted;
        $scope.table = 'unresolved';
      }
    };

    $scope.today = function() {
      return moment().utc().format('YYYY-MM-DD');
    };

    $scope.doChore = function(id, index) {
      console.log($scope.chores[index]);
      var temp = $scope.chores[index];
      temp.apartment_id = $scope.apartment.id;
      temp.user_id = $scope.userId;
      var chore = {};
      $http.post('/chores/complete/:chore', temp)
        .success(function(data) {
          if($scope.chores[index].interval == 0) {
            $scope.chores.splice(index, 1);
            temp.completed = true;
            $scope.chores_completed.push(temp);
          } else {
            console.log(data);
            chore = data.chore;
            chore.users = data.users;
            $scope.chores[index] = chore;
            temp.completed = true;
            $scope.chores_completed.unshift(temp);
          }
        }).error(function(data){
          console.log(data);
        });
    };

    $scope.isDone = function(id, index){
      if($scope.chores[index].completed == true) {
        return false;
      } else {
        return true;
      }
    };

    //set up delete chore id and index
    $scope.prepareDelete = function(id, index) {
      $scope.deleteId = id;
      $scope.deleteIdx = index;

    };

    //reset delete chore id and index
    $scope.resetDelete = function() {
      $scope.deleteId = -1;
      $scope.deleteIdx = -1;
    };

    $scope.setDefaultRotation = function() {
      $scope.chore.rotation_number = 1;
    };

    $scope.emptyChoreList = function() {
      if($scope.loaded && $scope.chores_uncompleted.length == 0 && $scope.table === 'unresolved') {
        return true;
      } else {
        if ($scope.table === 'resolved' && $scope.chores_completed.length == 0) {
            return true;
        }
        return false;
      }
    };

    //all functions to manage the dynamic menu in add and edit chores UI modals
    $scope.menuEmpty = function() {
      return $scope.menuList.length == 0;
    };

    $scope.responsibleEmpty = function() {
      return $scope.responsibleList.length == 0;
    };

    $scope.users_at_least_two = function() {
      return ($scope.responsibleList.length < 2 ||
              parseInt($scope.chore.interval) == 0);
    };

    $scope.users_and_rotating = function() {
      return !($scope.responsibleList.length > 1 && $scope.chore.rotating == true);
    };

    $scope.populate_rotation = function() {
      $scope.rotation_number = [];
      for(var i = 1; i < $scope.responsibleList.length; i++) {
        $scope.rotation_number[(i - 1)] = i;
      }
    };

    $scope.check_interval = function() {
      return (parseInt($scope.chore.interval) == 0);
    };
    //end all functions to control dynamic UI

    //heroku time zone bugfix
    function convert_to_EST(date) {
      // create Date object for current location
      var d = new Date(date);

      var offset = -5.0;
      // convert to msec
      // add local time zone offset 
      // get UTC time in msec
      var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

      return new Date(utc + (3600000*offset));
    }

    function convert_from_EST(date) {
      var d = new Date(date);
      
      var offset = 5.0;

      var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

      return new Date(utc + (3600000*offset));
    }

});


