'use strict';

angular.module('main.board', []);

// Angular controller for message board
angular.module('main.board').controller('BoardCtrl',
  function ($scope, $http, $timeout) {

    $scope.newMessage = {subject: '', body: ''};

    //get all messages to put into the message board
    $http.get('/messages').
    	success(function(data) {
      	$scope.messages = data.messages;
        console.log(data);
    	});

    //get the user to know which messages/comments can be edited
    $http.get('/user').
      success(function(user){
         $scope.user = user;
      });

    //add a message
    $scope.addMessage = function(){
    	
    	var message = angular.copy($scope.newMessage);

    	$http.post('/messages', message).
	      	success(function(data) {
            data.comments = [];
	        	$scope.messages.splice(0,0,data);
	        	$scope.reset();
	      	}).
        	error(function(data, status, headers, config){
          		console.log(data);
          		$scope.errormsg = data.error;
          		$scope.error = true;
          		$timeout(function(){$scope.error=false;},1000);
        	});
    };

    $scope.deleteMessage = function(id, index){

    	$http.delete('/messages/'+id).
	      	success(function(data) {
	        	$scope.messages.splice(index, 1);
	      	}).
        	error(function(data, status, headers, config){
          		$scope.errormsg = data.error;
          		$scope.error = true;
          		$timeout(function(){$scope.error=false;},1000);
        	});

    };

    //update a message
    $scope.updateMessage = function(id, index){

    	$http.put('/messages/'+id, $scope.messages[index]).
	      	success(function(data) {
	        	$scope.messages[index].edit = false;
	      	}).
        	error(function(data, status, headers, config){
          		console.log(data);
          		$scope.errormsg = data.error;
        	});

    };

    //get previous comments: TODO
    $scope.getPrevious = function(){

    };

    //add a comment
    $scope.addComment = function(msg_ind, msg_id){

    	var comment = angular.copy($scope.messages[msg_ind].newComment);
    	comment.msg_id = $scope.messages[msg_ind].id;

    	$http.post('/messages/'+comment.msg_id+'/comments/', comment).
	      	success(function(data) {
	        	$scope.messages[msg_ind].comments.push(data);
            $scope.messages[msg_ind].newComment = {};
            $scope.messages[msg_ind].showComments = true;
	      	}).
        	error(function(data, status, headers, config){
          		console.log(data);
          		$scope.errormsg = data.error;
        	});
    };

    //delete a comment
    $scope.deleteComment = function(id, msg_id, ind, msg_ind){

      console.log($scope.messages[msg_ind].comments[ind]);

    	$http.delete('messages/'+msg_id+'/comments/'+id).
	      	success(function(data) {
	        	$scope.messages[msg_ind].comments.splice(ind, 1);
	      	}).
        	error(function(data, status, headers, config){
          		console.log(data);
          		$scope.errormsg = data.error;
        	});
    };

    $scope.reset = function(){
    	$scope.newMessage = {};
    };

    $scope.postButton = function(){
      return (($scope.newMessage.subject  == '') || ($scope.newMessage.body == '')) ? false : true;
    };

    $scope.format = function(date){
      return moment(date).calendar();
    }

});
