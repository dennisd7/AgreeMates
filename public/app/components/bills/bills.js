'use strict';

angular.module('main.bills', []);

// Angular controller for bills
angular.module('main.bills').controller('BillsCtrl',
  function($http, $scope, $timeout) {
    //alert msg show length in ms
    var alertLength = 2000;

    //bills being showed currently
    $scope.bills = [];
    //unresolved bills
    $scope.unresolvedBills = [];
    //which table (resolved or unresolved) is selected
    $scope.table = '';
    //new bill being added
  	$scope.bill = {};
    //balance when adding a bill
    $scope.balance = 0;
    //selected roommates and their amount when adding a bill
    $scope.selectedRoommates = [];
    //all checked bills
    $scope.checkboxes = [];
    //the bill being updated
    $scope.oldBill = {};
    //all roommates id and their old amount when updating a bill, if a roommate has no amount, the default is 0
    $scope.updatedAmount = [];
    //index of bill being updated
    $scope.updateIdx;
    //balance between model
    $scope.balances = [];
    //delete bill id
    $scope.deleteId = -1;
    //delete bill index
    $scope.deleteIdx = -1;


    //get current user ID and name
    $http.get('/user').
    success(function(data) {
      $scope.userId = data.id;
      $scope.userFirstName = data.first_name;
      $scope.userLastNanme = data.last_name;
    }).
    error(function(data, status, headers, config){
        console.log(data);
    });

    //get all roommates in the apartment
    $http.get('/apartment/users').
    success(function(data) {
      $scope.roommates = data.users;
    }).
    error(function(data, status, headers, config){
        console.log(data);
    });    

  	//get all unresolved bills and set them to default
    $http.get('/bills', {params: {type: 'unresolved'}}).
    success(function(data) {
      $scope.unresolvedBills = data.bills;
      $scope.bills = $scope.unresolvedBills;
      $scope.table = 'unresolved';
      $scope.updateBalanceModel();
    }).
    error(function(data, status, headers, config){
        console.log(data);
    });

    //get all resolved bills
    $http.get('/bills', {params: {type: 'resolved'}}).
    success(function(data) {
      $scope.resolvedBills = data.bills;
    }).
    error(function(data, status, headers, config){
        console.log(data);
    });

    //generate the balances model
    $scope.updateBalanceModel = function() {
      $scope.balances = [];
      //set up roommates information
      for (var i = 0; i < $scope.roommates.length; i++) {
        if ($scope.roommates[i].id != $scope.userId) {
          var balance = {};
          balance.userId = $scope.roommates[i].id;
          balance.first_name = $scope.roommates[i].first_name;
          balance.last_name = $scope.roommates[i].last_name;
          balance.owedToUser = 0;
          balance.userOwed = 0;
          balance.netBalance = 0;
          $scope.balances.push(balance);
        }
      };

      //for each bill's payments, 
      for (var i = 0; i < $scope.unresolvedBills.length; i++) {
        //if the user if the creator, update the amount others owe to him
        if ($scope.unresolvedBills[i].creatorId == $scope.userId) {          
          for (var j = 0; j < $scope.balances.length; j++) {
            for (var k = 0; k < $scope.unresolvedBills[i].payments.length; k++) {
              if ($scope.balances[j].userId == $scope.unresolvedBills[i].payments[k].userId && !$scope.unresolvedBills[i].payments[k].paid) {
                //$scope.balances[j].owedToUser.push({"bill": $scope.unresolvedBills[i].name, "amount": parseFloat($scope.unresolvedBills[i].payments[k].amount)});
                $scope.balances[j].owedToUser += parseFloat($scope.unresolvedBills[i].payments[k].amount);
                $scope.balances[j].netBalance += parseFloat($scope.unresolvedBills[i].payments[k].amount);
              }
            };
          };
        } 
        //if the user is not the creator, update the amount he owe to that creator
        else {
          for (var j = 0; j < $scope.balances.length; j++) {
            if ($scope.balances[j].userId == $scope.unresolvedBills[i].creatorId) {
              for (var k = 0; k < $scope.unresolvedBills[i].payments.length; k++) {
                if ($scope.balances[j].userId == $scope.unresolvedBills[i].payments[k].userId && !$scope.unresolvedBills[i].payments[k].paid) {
                  //$scope.balances[j].userOwed.push({"bill": $scope.unresolvedBills[i].name, "amount": parseFloat($scope.unresolvedBills[i].payments[k].amount)});
                  $scope.balances[j].userOwed += parseFloat($scope.unresolvedBills[i].payments[k].amount);
                  $scope.balances[j].netBalance -= parseFloat($scope.unresolvedBills[i].payments[k].amount);
                }
              };
            }
          };
        }
      };   
    }

    //select unresolved bills or resolved bills
    $scope.setTable = function(table) {
    	if (table == 'resolved') {
    		$scope.bills = $scope.resolvedBills;
        $scope.table = 'resolved';
    	} else {
    		$scope.bills = $scope.unresolvedBills;
        $scope.table = 'unresolved';
    	}   	
    };

    //get all roommates in the apartment
    $http.get('/apartment/users').
    success(function(data) {
      $scope.roommates = data.users;
    }).
    error(function(data, status, headers, config){
        console.log(data);
    });

    //add a new bill
    $scope.addBill = function() {
    	var bill = angular.copy($scope.bill);
      //process each roommate's payment amount
      bill.roommates = [];
      for (var i = 0; i < $scope.roommates.length; i++) {
        if ($scope.selectedRoommates.indexOf($scope.roommates[i].id) > -1) {
          bill.roommates.push({"id": $scope.roommates[i].id, "amount": $scope.roommates[i].amount});
        };
      };
    	$http.post('/bills/', bill).
	      success(function(data) {
          //simulate the new bill into existing bills;
          var newBill = {}
          newBill.id = data.id;
          newBill.name = bill.name;
          newBill.amount = bill.total;
          newBill.dueDate = bill.date;
          newBill.frequency = bill.interval;
          newBill.resolved = false;
          newBill.creatorId = $scope.userId;
          newBill.payTo = $scope.userFirstName;
          newBill.payments = [];
          for (var i = 0; i < bill.roommates.length; i++) {
            newBill.payments.push({"userId": bill.roommates[i].id, "amount": bill.roommates[i].amount, "paid": false});
          };
	        $scope.unresolvedBills.push(newBill);
          $scope.updateBalanceModel();
          showSucc("Bill "+bill.name+" successfully added!");
	       	$scope.reset();
	      }).
        error(function(data, status, headers, config){
          console.log(data);
        });
    };

    //remember roommates' id when they are checked
    $scope.toggleSelection = function toggleSelection(roommateID) {
      var idx = $scope.selectedRoommates.indexOf(roommateID);

      //is currently selected
      if (idx > -1) {
        $scope.selectedRoommates.splice(idx, 1);
      } else {
        $scope.selectedRoommates.push(roommateID);
      }
    };

    //set up delete bill id and index
    $scope.prepareDelete = function(id, index) {
      $scope.deleteId = id;
      $scope.deleteIdx = index;
    }

    //reset delete bill id and index
    $scope.resetDelete = function() {
      $scope.deleteId = -1;
      $scope.deleteIdx = -1;      
    }

    //delete a bill
    $scope.deleteBill = function() {
    	$http.delete('/bills/'+$scope.deleteId).
	      success(function(data) {
	        $scope.bills.splice($scope.deleteIdx, 1);
          $scope.updateBalanceModel();
          showSucc("Bill "+ $scope.bills[$scope.deleteIdx].name+" successfully deleted!");
	      }).
        error(function(data, status, headers, config){
          console.log(data);
        });
    };

    //update a bill
    $scope.updateBill = function(index) {
      var tempBill = {};
      tempBill.name = $scope.oldBill.name;
      tempBill.total = $scope.oldBill.amount;
      tempBill.interval = $scope.oldBill.frequency;
      tempBill.date = $scope.oldBill.dueDate;
      tempBill.roommates = [];
      var tempPayments = [];
      for (var i = 0; i < $scope.updatedAmount.length; i++) {
        //if the roommate is selected and the input box is filled
        if ($scope.updatedAmount[i].amount != '' && $scope.selectedRoommates.indexOf($scope.updatedAmount[i].userId) > -1) {
          tempBill.roommates.push({id: $scope.updatedAmount[i].userId, amount: $scope.updatedAmount[i].amount, paid: false});
          tempPayments.push({userId: $scope.updatedAmount[i].userId, amount: $scope.updatedAmount[i].amount, paid: false});
        }
      };
      console.log(tempBill);
    	$http.put('/bills/'+$scope.oldBill.id, tempBill).
	      success(function(data) {
          $scope.oldBill.payments = tempPayments;
          $scope.bills[$scope.updateIdx] = $scope.oldBill;
          $scope.updateBalanceModel();
          showSucc("Bill "+ tempBill.name+" successfully updated!");
	        $scope.reset();
	      }).
        error(function(data, status, headers, config){
          console.log(data);
        });
    };

    //mark a bill as paid or not paid
    $scope.payBill = function(id, index) {
      var paid = "false";
      //check or uncheck
      var idx = $scope.checkboxes.indexOf(id);
      //if is currently selected
      if (idx > -1) {
        $scope.checkboxes.splice(idx, 1);
      } else {
        $scope.checkboxes.push(id);
        paid = "true";
      }
      $http.put('/bills/'+id+"/payment", {paid: paid}).
        success(function(data) {
          for (var i = 0; i < $scope.bills[index].payments.length; i++) {
            if ($scope.bills[index].payments[i] == $scope.userId) {
              if (paid == "false") {
                $scope.bills[index].payments[i].paid = false;
              } else {
                $scope.bills[index].payments = true;
              }                         
            }
          };
          $scope.updateBalanceModel();
        }).
        error(function(data, status, headers, config){
          console.log(data);
        });
    };

    //return a boolean indictaing whether the bill is paid by the user
    $scope.isPaid = function(id, index) {
      var paid = false;
      for (var i = 0; i < $scope.bills[index].payments.length; i++) {
        if ($scope.bills[index].payments[i].userId == $scope.userId) {
          paid = $scope.bills[index].payments[i].paid;
          if ($scope.bills[index].payments[i].paid) {
            //if this bill is not checked
            if ($scope.checkboxes.indexOf(id) < 0) {
              $scope.checkboxes.push(id);
            }
          }
        }
      };
      return paid;
    };

    //return the amount owned by the current user for a bill
    $scope.amountOwed = function(id, index) {
      for (var i = 0; i < $scope.bills.length; i++) {
        if ($scope.bills[i].id == id){
          for (var i = 0; i < $scope.bills[index].payments.length; i++) {
            if ($scope.bills[index].payments[i].userId == $scope.userId) {
              return $scope.bills[index].payments[i].amount;
            }
          };
        }
      }
      return 0;
    };

    //set the oldBill to the bill that is selected to update
    $scope.prepareUpdate = function(id, index) {
      $scope.reset();
      $scope.updateIdx = index;
      //find the bill that is selected
      for (var i = 0; i < $scope.bills.length; i++) {
        if ($scope.bills[i].id == id){
          $scope.oldBill = angular.copy($scope.bills[i]);
          $scope.oldBill.dueDate = $scope.convertDate($scope.oldBill.dueDate);
          //add roommates's id who are currently responsible to selectedRoommates
          for (var i = 0; i < $scope.oldBill.payments.length; i++) {
            $scope.selectedRoommates.push($scope.oldBill.payments[i].userId);
          };

          //create updatedAmount model that holds all roommates and their amount of bill
          for (var i = 0; i < $scope.roommates.length; i++) {
            $scope.updatedAmount[i] = {};
            $scope.updatedAmount[i].userId = $scope.roommates[i].id;
            for (var j = 0; j < $scope.oldBill.payments.length; j++) {
              if ($scope.oldBill.payments[j].userId == $scope.updatedAmount[i].userId) {
                $scope.updatedAmount[i].amount = $scope.oldBill.payments[j].amount;
              }
            };
            if ($scope.updatedAmount[i].amount == undefined) {
              $scope.updatedAmount[i].amount = '';
            }
          };
        }
      };
    }

    //return whether a roommate should be checked when update a bill
    $scope.isChecked = function(roommateId) {
      if ($scope.oldBill.payments === undefined) {
        return false;
      }
      for (var i = 0; i < $scope.oldBill.payments.length; i++) {
        if ($scope.oldBill.payments[i].userId == roommateId) {
          return true;
        }
      };
      return false;
    }

    $scope.isOwner = function(billId) {
      for (var i = 0; i < $scope.bills.length; i++) {
        if ($scope.bills[i].id == billId && $scope.bills[i].creatorId == $scope.userId) {
          return true;
        }
      };
      return false;
    }

    // $scope.showBalance = function(arr) {
    //   if (arr.length == 0) {
    //     return "$0";
    //   }

    //   var total = 0;
    //   var result = "";

    //   result += "$" + arr[0].amount + "(" + arr[0].bill + ")";
    //   total += arr[0].amount;
    //   for (var i = 1; i < arr.length; i++) {
    //     result += " + $" + arr[i].amount + "(" + arr[i].bill + ")";
    //     total += arr[i].amount;
    //   };
    //   return result + " = $" + total;
    // }

    //clear the bill
    $scope.reset = function() {
      $scope.bill = {};
      $scope.selectedRoommates = [];
      $scope.oldBill = {};
      $scope.updateIdx = 0;
      $scope.updatedAmount = [];
    };

    //return whether there are any unresolved bills
    $scope.emptyBillList = function(){
      return $scope.unresolvedBills.length == 0 ? true : false;
    };

    $scope.convertDate = function(date) {
      return date.split('T')[0];
    }

    //formate the date
    $scope.format = function(date) {
      return moment(date).format('MMMM Do, YYYY');
    };

    //show and hide an error msg
    function showErr(msg){
      console.log(data);
      $scope.errormsg = msg;
      $scope.error = true;
      $timeout(function(){$scope.error=false;},alertLength);
    }

    //show and hide a success msg
    function showSucc(msg){
      $scope.successmsg = msg;
      $scope.success = true;
      $timeout(function(){$scope.success=false;},alertLength);
    }
});
