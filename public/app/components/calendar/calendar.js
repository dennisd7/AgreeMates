// AngularJS controller for history

'use strict';

angular.module('main.calendar', ['ui.bootstrap','ui.calendar']);

angular.module('main.calendar').controller('CalendarCtrl', 
    function ($scope, $http, $modal) {

    //get request didn't return yet   
    $scope.loaded = false;

    //global variables
    $scope.chores = [];
    $scope.chores_uncompleted = [];
    $scope.chores_completed = [];

    $scope.userId = {};
    $scope.userFirstName = {};
    $scope.userLastName = {};
    $scope.daysinmonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    //global variables for bills
    $scope.unresolvedBills;
    $scope.bills;

    //variable for events
    $scope.events = [];

    //calendar variable for events
    //$scope.eventSources = [];

    $scope.associativeArray = {};

    /* config object */
    $scope.uiConfig = {
      calendar:{
        height: 450,
        editable: true,
        header:{
          left: '',
          center: 'title',
          right: 'today prev,next'
        },
        eventClick: $scope.alertOnEventClick
        // eventDrop: $scope.alertOnDrop,
        // eventResize: $scope.alertOnResize
      }
    };

  	$http.get('/calendar').
    success(function(data) {
    $scope.title = data.title;
      
    }).
    error(function(data){
        showErr(data.error);
    });

    //get current user ID and name
    $http.get('/user').
    success(function(data) {
        $scope.currUser = data;
        $scope.userId = data.id;
        $scope.userFirstName = data.first_name;
        $scope.userLastName = data.last_name;
        console.log("hello");
        console.log($scope.userId);
    }).
    error(function(error){
        console.log(error);
    });


    $http.get('/chores')
    .success(function(data) {
        
        console.log(data);
        for (var x = 0; x < $scope.chores.length; x++) {
            for (var i = 0; i < $scope.chores[x].users[i].length; i++) {
            $scope.chores[x].users[i].user_id = $scope.chores[x].users[i].id;
            }
        }
        
        for (var x = 0; x < data.chores.length; x++){
            if(data.chores[x].completed == true)
            {
                $scope.chores_completed.unshift(data.chores[x]);
            }
            else
            {
                $scope.chores_uncompleted.unshift(data.chores[x]);
            }
        }
        $scope.chores = $scope.chores_uncompleted;

        //var date = new Date($scope.chores[0].duedate);
        //console.log(date);

        for(var x = 0; x < $scope.chores.length; x++)
        {
        $scope.events.push(chore_to_event($scope.chores[x]));

        }
        $('#mycalendar').fullCalendar( 'rerenderEvents' );
        $scope.loaded = true;
    })
    .error(function(error) {
        $scope.chores = $scope.chores_uncompleted;
        $scope.table = 'unresolved';
        console.log(error);
    });

    //get all unresolved bills and set them to default
    $http.get('/bills', {params: {type: 'unresolved'}}).
    success(function(data) {
    $scope.unresolvedBills = data.bills;
    $scope.bills = $scope.unresolvedBills;

    for(var x = 0; x < $scope.chores.length; x++)
        {
        $scope.events.push(bill_to_event($scope.bills[x]));

        }
        $('#mycalendar').fullCalendar( 'rerenderEvents' );
        $scope.loaded = true;

    }).
    error(function(data){
        showErr(data.error);
    });



    var currentView = "month";
    

    /* event source that contains custom events on the scope */
    // $scope.events = [
    //   {title: 'All Day Event',start: new Date(y, m, 1)},
    //   {title: 'Long Event',start: new Date(y, m, d - 5),end: new Date(y, m, d - 2)},
    //   {id: 999,title: 'Repeating Event',start: new Date(y, m, d - 3, 16, 0),allDay: false},
    //   {id: 999,title: 'Repeating Event',start: new Date(y, m, d + 4, 16, 0),allDay: false},
    //   {title: 'Birthday Party',start: new Date(y, m, d + 1, 19, 0),end: new Date(y, m, d + 1, 22, 30),allDay: false},
    //   {title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
    // ];
    // /* event source that calls a function on every view switch */
    // $scope.eventsF = function (start, end, callback) {
    //   var s = new Date(start).getTime() / 1000;
    //   var e = new Date(end).getTime() / 1000;
    //   var m = new Date(start).getMonth();
    //   //console.log(m);
    //   //console.log(e);

    //   var events = [{title: 'Feed Me ', start: new Date(y, m, d, 6, 0) , end: new Date(y, m, d, 24, 0), allDay: false, 
    //   className: ['customFeed'], editable: false}];
    //   callback(events);
    // };

    $scope.openModal = function () {

    var modalInstance = $modal.open({
      templateUrl: 'chores_edit_modal.html'
      });
    };

    $scope.alertOnEventClick = function( event, allDay, jsEvent, view ){

        $scope.alertMessage = (event.title + ' was clicked ');
        //$scope.openModal();
    };

    $scope.alertOnMouseHover = function(event, jsEvent, view){
        event.backgroundColor = 'yellow';
        
    };

    // $scope.calEventsExt = {
    //    color: '#f00',
    //    textColor: 'yellow',
    //    events: [ 
    //       {type:'party',title: 'Lunch',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
    //       {type:'party',title: 'Lunch 2',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
    //       {type:'party',title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
    //     ]
    // };
    /* alert on eventClick */



    // /* alert on Drop */
    //  $scope.alertOnDrop = function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view){
    //    $scope.alertMessage = ('Event Droped to make dayDelta ' + dayDelta);
    // };
    // /* alert on Resize */
    // $scope.alertOnResize = function(event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view ){
    //    $scope.alertMessage = ('Event Resized to make dayDelta ' + minuteDelta);
    // };

    /* add and removes an event source of choice */
    // $scope.addRemoveEventSource = function(sources,source) {
    //   var canAdd = 0;
    //   angular.forEach(sources,function(value, key){
    //     if(sources[key] === source){
    //       sources.splice(key,1);
    //       canAdd = 1;
    //     }
    //   });
    //   if(canAdd === 0){
    //     sources.push(source);
    //   }
    // };
    // /* add custom event*/
    // $scope.addEvent = function() {
    //   $scope.events.push({
    //     title: 'Open Sesame',
    //     start: new Date(y, m, 28),
    //     end: new Date(y, m, 29),
    //     className: ['openSesame']
    //   });
    // };
    // /* remove event */
    // $scope.remove = function(index) {
    //   $scope.events.splice(index,1);
    // };
    // /* Change View */
    // $scope.changeView = function(view,calendar) {
    //   calendar.fullCalendar('changeView',view);
    // };
    // /* Change View */
    // $scope.renderCalender = function(calendar) {
    //   calendar.fullCalendar('render');
    // };


    //with this you can handle the events that generated when we change the view i.e. Month, Week and Day
    $scope.changeView = function(view,calendar) {
        currentView = view;
        calendar.fullCalendar('changeView',view);
        // $scope.$apply(function(){
        //   $scope.alertMessage = ('You are looking at '+ currentView);
        // });
    };


    // $scope.eventsF = function (start, end, callback) {
    //     var events = [];
    //     var temp = {};

    //     for (var x = 0; x < $scope.chores.length; x++)
    //     { 
    //         var interval = $scope.chores[x].interval;
    //         if(interval != 0)
    //         {
    //             var date = new Date( $scope.chores.duedate);
    //             var d = date.getDate();
    //             var m = new Date(start).getMonth();
    //             var chore_m = date.getMonth();
    //             if(m > chore_m)
    //             {
    //                 var w = m - chore_m;
    //                 while((d < $scope.daysinmonth[chore_m])
    //             }
    //             else
    //             {

    //             }

    //             var y = date.getFullYear();
    //             temp.title = $scope.chores[x].name;
    //             temp.allDay = false;
    //             temp.editable = false;
    //             temp.color = 'grey';
    //             for(var z = interval; z < $scope.daysinmonth[m]; z = z + z)
    //             {
    //             temp.start = new Date(y, m, d+z, 0, 0);
    //             temp.end = new Date(y, m, d+z, 16, 0);
    //             events.push(temp);
    //             }
    //         }
    //     }
    //     var events = [{title: 'Feed Me ' + m,start: 0,end: 0, allDay: false}];
    //     callback(events);
    // };

    /* event sources array*/
    // $scope.eventSources = [$scope.events, $scope.eventSource, $scope.eventsF];
    // $scope.eventSources2 = [$scope.calEventsExt, $scope.eventsF, $scope.events];
    
    $scope.eventSources = [$scope.events];

    function arrayObjectIndexOf(myArray, searchTerm, property) {
        for(var i = 0, len = myArray.length; i < len; i++) 
        {
            console.log(myArray);
            if (myArray[i][property] === searchTerm) 
                {
                    return i;
                }
        }
        
        return -1;
    }

    function users_to_string (myArray)
    {
        var temp_string = '';
        for(var i = 0, len = myArray.length; i < len; i++) 
        {
            temp_string = temp_string + myArray[i].first_name + ", ";
        }
        return temp_string;
    }

    function interval_to_0 (an_interval)
    {
        if(an_interval === 1)
        {
            return 0;
        }
        else
        {
            if(an_interval === 7)
            {
                return 6;
            }
            return an_interval;
        }
    }

    function interval_to_string (an_interval)
    {
        if(an_interval === 0 || an_interval === 1)
        {
            return ' by this day';
        }
        else
        {
            return ' during this week';
        }

    }

    function chore_to_responsible_list(chore)
    {

    }

    function bill_to_event(bill)
    {
        var a_event = {};
        var date = new Date(bill.dueDate);
        var d = date.getDate();
        var m = date.getMonth();
        var y = date.getFullYear();

        var payment_index =  arrayObjectIndexOf(bill.payments, $scope.userId, "userId");
        if(payment_index === -1)
        {
            console.log("b");
        }
        else
        {
            var amount = bill.payments[payment_index].amount;
            var paid = bill.payments[payment_index].paid;
            if ((amount - paid) === 0)
            {
            }
            else
            {
            console.log("a");
            a_event.title = 'You are responsible for the bill "' + bill.name + '"' + ' by this day for the amount of $' + 
            (amount - paid) + ' to be paid to ' + bill.payTo;
            a_event.start = new Date(y, m, d, 0, 0);
            a_event.end = new Date(y, m, d, 22, 0);
            a_event.allDay = true;
            a_event.editable = false;
            a_event.color = 'Orange';
            return a_event;
            }
        }

    }

    function chore_to_event(chore)
    {
        var a_event = {};
        var date = new Date(chore.duedate);
        var d = date.getDate();
        var m = date.getMonth();
        var y = date.getFullYear();

        if( !(chore.duedate in $scope.associativeArray))
        {
            $scope.associativeArray[chore.duedate] = 6;
        }
        else
        {
            $scope.associativeArray[chore.duedate] = $scope.associativeArray[chore.duedate] + 2;
        }

        if(arrayObjectIndexOf(chore.users, $scope.userId, "user_id") === -1)
        {
            console.log("b");
            a_event.title = 'Your roommate(s) ' + users_to_string(chore.users) + 'are responsible for the chore "' + chore.name + '"' + interval_to_string(chore.interval);
            a_event.start = new Date(y, m, d - interval_to_0(chore.interval), $scope.associativeArray[chore.duedate], 0);
            a_event.end = new Date(y, m, d, $scope.associativeArray[chore.duedate] + 2, 0);
            a_event.allDay = true;
            a_event.editable = false;
            return a_event;
        }
        else
        {
            console.log("a");
            a_event.title = 'You are responsible for the chore "' + chore.name + '"' + interval_to_string(chore.interval);
            a_event.start = new Date(y, m, d - interval_to_0(chore.interval), $scope.associativeArray[chore.duedate], 0);
            a_event.end = new Date(y, m, d, $scope.associativeArray[chore.duedate] + 2, 0);
            a_event.allDay = true;
            a_event.editable = false;
            a_event.color = 'IndianRed';
            return a_event;

        }
    }
	


	});

