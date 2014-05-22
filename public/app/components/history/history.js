// AngularJS controller for history

'use strict';

angular.module('main.history', []);

angular.module('main.history').controller('HistoryCtrl',
  function ($scope, $http) {

    var addedItems = true;

    $scope.history = [];

    $http.get('/history')
      .success(function(data) {
        $scope.history = data.history;
      })
      .error(function(error) {});

    $scope.showNothingMoreMessage = function(date) {
      return !addedItems;
    };

    $scope.format = function(date) {
      return moment(date).calendar();
    };

    $scope.loadMore = function() {
      var lastId = $scope.history[$scope.history.length - 1].id;

      $http.get('/history/' + lastId)
        .success(function(data) {
          var previousLength = $scope.history.length;
          $scope.history = $scope.history.concat(data.history);
          if ($scope.history.length === previousLength) {
            addedItems = false;
          }
        })
        .error(function() {});
    };

});
