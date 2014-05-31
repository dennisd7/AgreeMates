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
    //add roommates and their share of bill
    $scope.roommates = []
    //all roommates id and their old amount when updating a bill, if a roommate has no amount, the default is 0
    $scope.updatedAmount = [];
    //index of bill being updated
    $scope.updateIdx;
    //balance between model, [{userID, first_name, last_name, owedToUser, userOwed, netBalance}]
    $scope.balances = [];
    //delete bill id
    $scope.deleteId = -1;
    //delete bill index
    $scope.deleteIdx = -1;
    //get request didn't return yet
    $scope.loaded = false;

    //get current user ID and name
    $http.get('/user').
    success(function(data) {
      $scope.userId = data.id;
      $scope.userFirstName = data.first_name;
      $scope.userLastName = data.last_name;
    }).
    error(function(data, status, headers, config){
        showErr(data.error);
    });

    //get all roommates in the apartment
    $http.get('/apartment/users').
    success(function(data) {
      $scope.roommates = data.users;
      $scope.responsible = angular.copy($scope.roommates);
    }).
    error(function(data, status, headers, config){
        showErr(data.error);
    });

  	//get all unresolved bills and set them to default
    $http.get('/bills', {params: {type: 'unresolved'}}).
    success(function(data) {
      $scope.unresolvedBills = data.bills;
      $scope.bills = $scope.unresolvedBills;
      $scope.table = 'unresolved';
      $scope.updateBalanceModel();
      //put all paid bills' id into checkboxes
      for (var i = 0; i < $scope.bills.length; i++) {
        for (var j = 0; j < $scope.bills[i].payments.length; j++) {
          if ($scope.bills[i].payments[j].userId == $scope.userId && $scope.bills[i].payments[j].paid) {
            //if this bill is not checked already
            if ($scope.checkboxes.indexOf($scope.bills[i].id) < 0) {
              $scope.checkboxes.push($scope.bills[i].id);
            }
          }
        };
      };
      $scope.loaded = true;
      $('.hide').removeClass('hide');
    }).
    error(function(data, status, headers, config){
        showErr(data.error);
    });

    //get all resolved bills
    $http.get('/bills', {params: {type: 'resolved'}}).
    success(function(data) {
      $scope.resolvedBills = data.bills;
      for (var i = 0; i < $scope.resolvedBills.length; i++) {
        for (var j = 0; j < $scope.resolvedBills[i].payments.length; j++) {
          if ($scope.resolvedBills[i].payments[j].userId == $scope.userId && $scope.resolvedBills[i].payments[j].paid) {
            //if this bill is not checked already
            if ($scope.checkboxes.indexOf($scope.resolvedBills[i].id) < 0) {
              $scope.checkboxes.push($scope.resolvedBills[i].id);
            }
          }
        };
      };
    }).
    error(function(data, status, headers, config){
        showErr(data.error);
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
        //if the user is not the creator, update the amount he owes to that creator
        else {
          for (var j = 0; j < $scope.balances.length; j++) {
            if ($scope.balances[j].userId == $scope.unresolvedBills[i].creatorId) {
              for (var k = 0; k < $scope.unresolvedBills[i].payments.length; k++) {
                if ($scope.userId == $scope.unresolvedBills[i].payments[k].userId && !$scope.unresolvedBills[i].payments[k].paid) {
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

    //add a new bill
    $scope.addBill = function() {
    	var bill = angular.copy($scope.bill);
      //process each roommate's payment amount
      bill.roommates = [];
      for (var i = 0; i < $scope.responsible.length; i++) {
        if ($scope.selectedRoommates.indexOf($scope.responsible[i].id) > -1) {
          bill.roommates.push({"id": $scope.responsible[i].id, "amount": $scope.responsible[i].amount});
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
          $scope.updateIdx = -1;
          showSucc("Bill "+bill.name+" successfully added!");
	       	$scope.reset();
	      }).
        error(function(data, status, headers, config){
          showErr(data.error);
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
          showSucc("Bill "+ $scope.bills[$scope.deleteIdx].name+" successfully deleted!");
	        $scope.bills.splice($scope.deleteIdx, 1);
          $scope.updateBalanceModel();
          $scope.updateIdx = -1;
	      }).
        error(function(data, status, headers, config){
          showErr(data.error);
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

    	$http.put('/bills/'+$scope.oldBill.id, tempBill).
	      success(function(data) {
          $scope.oldBill.payments = tempPayments;
          $scope.bills[$scope.updateIdx] = $scope.oldBill;
          $scope.updateBalanceModel();
          showSucc("Bill "+ tempBill.name+" successfully updated!");
	        $scope.reset();
	      }).
        error(function(data, status, headers, config){
          showErr(data.error);
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
          //use if
          for (var j = 0; j < $scope.bills.length; j++) {
            if ($scope.bills[j].id == id) {
              for (var i = 0; i < $scope.bills[index].payments.length; i++) {
                if ($scope.bills[index].payments[i].userId == $scope.userId) {
                  if (paid == "false") {
                    $scope.bills[index].payments[i].paid = false;
                  } else {
                    $scope.bills[index].payments[i].paid = true;
                  }
                }
              };              
            }
          };
          $scope.updateBalanceModel();
        }).
        error(function(data, status, headers, config){
          showErr(data.error);
        });
    };

    //return a boolean indictaing whether the bill is paid by the user
    $scope.isPaid = function(id, index) {
      for (var i = 0; i < $scope.bills[index].payments.length; i++) {
        if ($scope.bills[index].payments[i].userId == $scope.userId) {
          return $scope.bills[index].payments[i].paid;
        }
      };
      return false;
    };

    //return whether the user is responsible for this bill
    $scope.isResponsible = function(id) {
      for (var i = 0; i < $scope.bills.length; i++) {
        if ($scope.bills[i].id == id) {
          for (var j = 0; j < $scope.bills[i].payments.length; j++) {
            if ($scope.bills[i].payments[j].userId == $scope.userId) {
              return true;
            }
          };
        }
      };
      return false;
    }

    //return the amount owned by the current user for a bill
    $scope.amountOwed = function(id, index) {
      for (var i = 0; i < $scope.bills[index].payments.length; i++) {
        if ($scope.bills[index].payments[i].userId == $scope.userId) {
          return $scope.showTwoDecimal($scope.bills[index].payments[i].amount);
        }
      };
      return 0;
    };

    //set the oldBill to the bill that is selected to update
    $scope.prepareUpdate = function(id, index) {
      $scope.reset();
      $scope.prepareDelete(id, index);
      $scope.updateIdx = index;
      //find the bill that is selected
      for (var i = 0; i < $scope.bills.length; i++) {
        if ($scope.bills[i].id == id){
          $scope.oldBill = angular.copy($scope.bills[i]);
          $scope.oldBill.dueDate = $scope.convertDate($scope.oldBill.dueDate);
          //add roommates's id who are currently responsible to selectedRoommates
          for (var j = 0; j < $scope.oldBill.payments.length; j++) {
            $scope.selectedRoommates.push($scope.oldBill.payments[j].userId);
          };

          //create updatedAmount model that holds all roommates and their amount of bill
          for (var j = 0; j < $scope.roommates.length; j++) {
            $scope.updatedAmount[j] = {};
            $scope.updatedAmount[j].userId = $scope.roommates[j].id;
            for (var k = 0; k < $scope.oldBill.payments.length; k++) {
              if ($scope.oldBill.payments[k].userId == $scope.updatedAmount[j].userId) {
                $scope.updatedAmount[j].amount = $scope.oldBill.payments[k].amount;
              }
            };
            if ($scope.updatedAmount[j].amount == undefined) {
              $scope.updatedAmount[j].amount = '';
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

    //return whether the user is the creator of a bill when updating
    $scope.isOwner = function(billId) {
      //when bill id is not defined
      if (billId === undefined) {
        if ($scope.updateIdx === undefined || $scope.updateIdx == -1) {
          return false;
        }
        billId = $scope.bills[$scope.updateIdx].id;
      }

      for (var i = 0; i < $scope.bills.length; i++) {
        if ($scope.bills[i].id == billId && $scope.bills[i].creatorId == $scope.userId) {
          return true;
        }
      };
      return false;
    }

    //split the bill amount evenly among all selected roommates
    $scope.splitBill = function() {
      var numRoommates = $scope.selectedRoommates.length;
      var amount = Math.floor(($scope.bill.total / numRoommates) * 100) / 100;
      var evenly = Math.floor(($scope.bill.total - amount * numRoommates) * 100);

      for (var i = 0; i < $scope.responsible.length; i++) {
        var responsible = false;
        for (var j = 0; j < $scope.selectedRoommates.length; j++) {
          if ($scope.selectedRoommates[j] == $scope.responsible[i].id) {
            responsible = true;
            $scope.responsible[i].amount = amount;
            if (evenly > 0) {
              $scope.responsible[i].amount += 0.01;
              $scope.responsible[i].amount = Math.round($scope.responsible[i].amount * 100) / 100;
              evenly--;
            }
          }
        };
        if (!responsible) {
          $scope.responsible[i].amount = '';
        }
      };
    }

    //split bill evenly when updating a bill
    //this function is similar to splitBill(), should refactor later.
    $scope.splitBillEdit = function() {
      var numRoommates = $scope.selectedRoommates.length;
      var amount = Math.round(($scope.oldBill.amount / numRoommates) * 100) / 100;
      var evenly = ($scope.bill.total - amount * numRoommates) * 100;

      for (var i = 0; i < $scope.updatedAmount.length; i++) {
        var responsible = false;
        for (var j = 0; j < $scope.selectedRoommates.length; j++) {
          if ($scope.selectedRoommates[j] == $scope.updatedAmount[i].userId) {
            responsible = true;
            $scope.updatedAmount[i].amount = amount;
            if (evenly > 0) {
              $scope.updatedAmount[i].amount += 0.01;
              $scope.updatedAmount[i].amount = Math.round($scope.updatedAmount[i].amount * 100) / 100;
              evenly--;
            }
          }
        };
        if (!responsible) {
          $scope.updatedAmount[i].amount = '';
        }
      };      
    }

    //put the dollar sign in front of the balance
    $scope.showBalance = function(num) {
      num = $scope.showTwoDecimal(num);
      if (num < 0) {
        num = num * -1;
        return '-$' + num;
      } else {
        return '$' + num;
      }
    }

    //check if each roommate's amount add up to total amount
    $scope.isValidResponsible = function(model) {
      var amounts;
      var total;

      //for adding bill, get total amount from $scope.bill.total and roommates' amount from $scope.responsible
      if (model == "add") {
        if ($scope.responsible == undefined) {
          return false;
        }      
        total = Math.round($scope.bill.total * 100) / 100;
        amounts = $scope.responsible;
        for (var i = 0; i < amounts.length; i++) {
          if ($scope.selectedRoommates.indexOf(amounts[i].id) > -1) {
            if (amounts[i].amount < 0) {
              return false;
            }
            total -= amounts[i].amount;
            total = Math.round(total * 100) / 100;
          };
        };        
      } else { //for updateing bill, get total amount from $scope.oldBill.amount and roommates' amount from $scope.updatedAmount
        if ($scope.updatedAmount == undefined) {
          return false;
        }
        total = Math.round($scope.oldBill.amount * 100) / 100;
        amounts = $scope.updatedAmount;
        for (var i = 0; i < amounts.length; i++) {
          if ($scope.selectedRoommates.indexOf(amounts[i].userId) > -1) {
            if (amounts[i].amount < 0) {
              return false;
            }
            total -= amounts[i].amount;
            total = Math.round(total * 100) / 100;
          };
        };         
      }

      return total == 0;
    }

    //clear the bill
    $scope.reset = function() {
      $scope.dismissAdd();
      $scope.dismissEdit();
      $scope.bill = {};
      $scope.selectedRoommates = [];
      $scope.oldBill = {};
      $scope.updateIdx = -1;
      $scope.updatedAmount = [];
      $scope.responsible = angular.copy($scope.roommates);
      $scope.addBillForm.name.$dirty = false;
      $scope.addBillForm.amount.$dirty = false;
      $scope.addBillForm.date.$dirty = false;
    };

    //return whether there are any unresolved bills
    $scope.emptyBillList = function(){
      return $scope.unresolvedBills.length == 0 && $scope.loaded ? true : false;
    };

    //return whether bills are empty and selected
    $scope.isUnresolvedEmptyAndSelected = function() {
      if ($scope.table == 'unresolved') {
        return $scope.unresolvedBills.length == 0;
      } else if ($scope.table == 'resolved') {
        return $scope.resolvedBills.length == 0;
      }
      return false;
    }

    $scope.showTwoDecimal = function(num) {
      if (num % 1 === 0) {
        return num;
      }
      return parseFloat(num).toFixed(2);
    }

    $scope.convertDate = function(date) {
      return date.split('T')[0];
    };

    $scope.today = function() {
      return moment().format('YYYY-MM-DD');
    }

    //formate the date
    $scope.format = function(date) {
      return moment(date).utc().format('MMMM Do, YYYY');
    };

    //show and hide an error msg
    function showErr(msg){
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
}).directive('addModal', function() {
   return {
     restrict: 'A',
     link: function(scope, element, attr) {
       scope.dismissAdd = function() {
           element.modal('hide');
       };
     }
   } 
}).directive('editModal', function() {
   return {
     restrict: 'A',
     link: function(scope, element, attr) {
       scope.dismissEdit = function() {
           element.modal('hide');
       };
     }
   } 
});
