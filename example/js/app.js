(function($window) {

    var app = $window.angular.module('myApp', ['ngCrossfilter']);

    /**
     * @controller BooksController
     */
    app.controller('BooksController', ['$scope', function($scope) {

        /**
         * @property direction
         * @type {String}
         * @default 'asc'
         */
        $scope.direction = 'asc';

        /**
         * @property books
         * @type {Array}
         */
        $scope.books = [
            { id: 1, name: '1984' },
            { id: 2, name: 'Brave New World' },
            { id: 3, name: 'Nausea' },
            { id: 4, name: 'Les Miserables' },
            { id: 5, name: 'Of Mice and Men' },
            { id: 6, name: 'The Master and Margarita' },
            { id: 7, name: 'The Little Prince' },
            { id: 8, name: 'The Doors of Perception' },
            { id: 9, name: 'Alice in Wonderland' }
        ]

    }]);

})(window);