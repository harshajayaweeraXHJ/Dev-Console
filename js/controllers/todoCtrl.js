/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
	.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, $filter, store, $http) {
		'use strict';

		getAllIntents();

		scope.dev_cred = "";

		$scope.todos = [];
		var todos = $scope.todos;

		$scope.newTodo = '';
		$scope.topicName = '';
		$scope.response = '';
		$scope.editedTodo = null;
	
		$scope.selected_intent = '';
		$scope.intents = [];


		// $scope.$watch('todos', function () {
		// 	$scope.remainingCount = $filter('filter')(todos, { completed: false }).length;
		// 	$scope.completedCount = todos.length - $scope.remainingCount;
		// 	$scope.allChecked = !$scope.remainingCount;
		// }, true);

		// Monitor the current route for changes and adjust the filter accordingly.
		$scope.$on('$routeChangeSuccess', function () {
			var status = $scope.status = $routeParams.status || '';
			console.log("status: " + status);
			$scope.statusFilter = (status === 'active') ? { completed: false } : (status === 'completed') ? { completed: true } : {};
			console.log($scope.statusFilter);
		});

		$scope.addTodo = function () {
			var newTodo =
				{
					title: $scope.newTodo.trim(),
					completed: false
				};

			if (!newTodo.title) {
				return;
			}

			$scope.todos.push($scope.newTodo.trim())
			$scope.newTodo = '';
		};

		$scope.editTodo = function (todo) {
			$scope.editedTodo = todo;
			// Clone the original todo to restore it on demand.
			$scope.originalTodo = angular.extend({}, todo);
		};

		$scope.saveEdits = function (todo, event) {
			// Blur events are automatically triggered after the form submit event.
			// This does some unfortunate logic handling to prevent saving twice.
			if (event === 'blur' && $scope.saveEvent === 'submit') {
				$scope.saveEvent = null;
				return;
			}

			$scope.saveEvent = event;

			if ($scope.reverted) {
				// Todo edits were reverted-- don't save.
				$scope.reverted = null;
				return;
			}

			todo.title = todo.title.trim();

			if (todo.title === $scope.originalTodo.title) {
				$scope.editedTodo = null;
				return;
			}

			store[todo.title ? 'put' : 'delete'](todo)
				.then(function success() {}, function error() {
					todo.title = $scope.originalTodo.title;
				})
				.finally(function () {
					$scope.editedTodo = null;
				});
		};

		$scope.revertEdits = function (todo) {
			todos[todos.indexOf(todo)] = $scope.originalTodo;
			$scope.editedTodo = null;
			$scope.originalTodo = null;
			$scope.reverted = true;
		};

		$scope.removeTodo = function (todo) {
			var todoIndex = $scope.todos.indexOf(todo);
			
			if(todoIndex > 0)
			{
				$scope.todos.splice(todoIndex, 1);	
			}
			
		};

		$scope.saveTodo = function (todo) {
			$scope.todos.push(todo);
		};

		$scope.clear = function (){
			$scope.selected_intent = "";
			$scope.topicName = '';
			$scope.response = '';
			$scope.todos = [];

		}

		$scope.getAllIntents = getAllIntents;  

		
		$scope.onIntentSelect = function ()
		{
			getIntent($scope.selected_intent.id).
				then(function (success)
				{
	            	console.log("Selected Intent:");
					console.log(success);
					$scope.todos.length = 0;
					for(var i = 0; i < success.data.userSays.length; i++)
					{
						$scope.todos.push(success.data.userSays[i].data[0].text);
					}
					
					$scope.topicName = success.data.name;
					$scope.response = success.data.responses[0].messages[0].speech;	

			    },function (error){
					console.log(error)
			     });
		}

		function getAllIntents() {
			$http.get(
					"https://api.dialogflow.com/v1/intents?v=20150910",
					{ headers :
						{"Authorization" : "Bearer " + scope.dev_cred}
					}
				)
            .then(function (success){
                 	$scope.intents = success.data;
                 	console.log($scope.intents)
		     },function (error){
				console.log(error)
		     });
		}

		function getIntent(id) {
			return $http.get(
					"https://api.dialogflow.com/v1/intents/" + id + "?v=20150910",
					{ headers :
						{"Authorization" : "Bearer " + scope.dev_cred , "Content-Type" : "application/json"}
					}
				);
       		}

		$scope.train = function () {

			// based on the selected intent call $scope.selected_intent

			var questionsArray = [];
			for (var i = 0; i<$scope.todos.length; i++)
			{
				questionsArray.push(
						{
					      "count": 0,
					      "data": [{ "text": $scope.todos[i] }]
					    }
					);	
			}

			var endpoint = "";
			var HttpVerb = "";
			if($scope.selected_intent=="")
			{
					endpoint = "https://api.dialogflow.com/v1/intents?v=20150910";
					HttpVerb = "post";
			}else{
				endpoint = "https://cors-anywhere.herokuapp.com/";
				endpoint =  endpoint + "https://api.dialogflow.com/v1/intents/" + $scope.selected_intent.id + "?v=20150910";
				HttpVerb = "put";
			}

			 $http[HttpVerb](endpoint, {
				  "name": $scope.topicName,
				  "contexts": [],
				  "templates": [],
				  "responses": [{
					"messages": [
					        {
					          "speech": $scope.response,
					          "type": 0
					        }
					      ]
				  }],
				  "userSays": questionsArray
			},
			{ headers : { 'Content-Type': 'application/json', "Authorization" : "Bearer " + scope.dev_cred } })
            .then(function (success){
            	console.log(success);
            	
            	$scope.topicName = '';
				$scope.response = '';
				$scope.selected_intent = '';
				$scope.todos = [];

		
		     },function (error){
				console.log(error)
		     });

		};

		$scope.deleteIntent = function(id)
		{
			$http.delete(
					"https://cors-anywhere.herokuapp.com/https://api.dialogflow.com/v1/intents/" + $scope.selected_intent.id + "?v=20150910",
					{ headers :
						{"Authorization" : "Bearer " + scope.dev_cred}
					}
				)
            .then(function (success){
                 	$scope.intents = success.data;
                 	console.log($scope.intents);
                 	$scope.clear();
		     },function (error){
				console.log(error)
		     });
		}

		$scope.toggleCompleted = function (todo, completed) {
			if (angular.isDefined(completed)) {
				todo.completed = completed;
			}
			store.put(todo, todos.indexOf(todo))
				.then(function success() {}, function error() {
					todo.completed = !todo.completed;
				});
		};

		$scope.clearCompletedTodos = function () {
			store.clearCompleted();
		};

		$scope.markAll = function (completed) {
			todos.forEach(function (todo) {
				if (todo.completed !== completed) {
					$scope.toggleCompleted(todo, completed);
				}
			});
		};
	});
