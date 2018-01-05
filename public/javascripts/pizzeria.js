var app = angular.module('pizzeria', ['ngResource','ngRoute','angularUtils.directives.dirPagination']);
app.config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/', {
            templateUrl: 'partials/home.html',
            controller: 'HomeCtrl'
        })
        .when('/trial', {
            templateUrl: 'partials/user.html',
            controller: 'HomeCtrl'
        })
        .when('/add-pizza', {
            templateUrl: 'partials/pizza-form.html',
            controller: 'AddPizzaCtrl'
        })
        .when('/pizza/:id', {
        templateUrl: 'partials/pizza-form.html',
        controller: 'EditPizzaCtrl'
        })
        .when('/pizza/user/:id', {
        templateUrl: 'partials/user_pizza.html',
        controller: 'EditPizzaCtrl'
        })
        .when('/pizza/delete/:id', {
        templateUrl: 'partials/pizza-delete.html',
        controller: 'DeletePizzaCtrl'
        })
       .when('/saved',{
           templateUrl : 'partials/history.html',
           controller : 'HistoryCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

//console.log("in pizzeria.js"+global.id);
app.controller('HomeCtrl', ['$scope', '$resource', 
    function($scope, $resource){
        var Pizzas = $resource('/api/pizzas');
        Pizzas.query(function(pizzas){
            $scope.pizzas = pizzas;
        });
    }]);


/*app.filter('pagination', function() {
    return function(data,start) {
        return data.slice(start);

    };
});*/



/*app.controller('CartCtrl', ['$scope', '$resource', 
    function($scope, $resource){
        var Cart = $resource('/trial');
        //console.log(Object.entries(obj));
        Cart.get(function(cart){
            console.log("trial:"+cart);

            $scope.carts = cart;
        });
    }]);*/


app.controller('AddPizzaCtrl', ['$scope', '$resource', '$location',
    function($scope, $resource, $location){
        $scope.save = function(){
            var Pizzas = $resource('/api/pizzas');
            Pizzas.save($scope.pizzas, function(){
                $location.path('/');
            });
        };
    }]);

app.controller('EditPizzaCtrl', ['$scope', '$resource', '$location', '$routeParams',
    function($scope, $resource, $location, $routeParams){   
        var Pizzas = $resource('/api/pizzas/:id', { id: '@_id' }, {
            update: { method: 'PUT' }
        });

        Pizzas.get({ id: $routeParams.id }, function(pizza){
           // console.log(req.session);
           // req.session.id1=$routeParams.id;
            $scope.pizzas = pizza;
        });

        $scope.save = function(){
            Pizzas.update($scope.pizzas, function(){
                $location.path('/');
            });
        }
    }]);


app.controller('DeletePizzaCtrl', ['$scope', '$resource', '$location', '$routeParams',
    function($scope, $resource, $location, $routeParams){
        var Pizzas = $resource('/api/pizzas/:id');

        Pizzas.get({ id: $routeParams.id }, function(pizza){
            $scope.pizzas = pizza;
        })

        $scope.delete = function(){
            Pizzas.delete({ id: $routeParams.id }, function(pizza){
                $location.path('/');
            });
        }
    }]);



app.controller('HistoryCtrl', ['$scope', '$resource', 
    function($scope, $resource){
        var Saved = $resource('/trial/saved');
        Saved.query(function(saveditems){
            console.log("saved : "+saveditems);
            $scope.saved = saveditems;
        });
    }]);



/*app.controller('PayCtrl', ['$scope', '$resource', '$location','$routeParams',
    function($scope, $resource){
        var Cart = $resource('/trial/:id');
        Cart.get({id : $routeParams.id},function(cart){
            $scope.cart = cart;
        });

        $scope.delete = function(){
            Cart.delete({ id: $routeParams.id }, function(cart){
                $location.path('/');
            });

        }
    }]);*/