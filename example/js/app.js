(function($window) {

    var app = $window.angular.module('myApp', ['ngCrossfilter']);

    /**
     * @controller BooksController
     */
    app.controller('BooksController', ['$scope', function($scope) {

        /**
         * @property options
         * @type {Object}
         */
        $scope.options = {

            filter: {
                property:   'name',
                value:      null
            },

            sort: {
                property:   'id',
                value:      'asc'
            },

            // Could be "afresh" or "reduce".
            strategy: 'afresh'

        };

        /**
         * @method addBook
         * @param name {String}
         * @return {void}
         */
        $scope.addBook = function addBook(name) {
            $scope.books.push({ id: 10, name: name });
        };

        /**
         * @property books
         * @type {Array}
         */
        $scope.books = [
            { id: 1, name: 'Nineteen Eighty-Four' },
            { id: 2, name: 'Brave New World' },
            { id: 3, name: 'Nausea' },
            { id: 4, name: 'Les Miserables' },
            { id: 5, name: 'Of Mice and Men' },
            { id: 6, name: 'The Master and Margarita' },
            { id: 7, name: 'The Little Prince' },
            { id: 8, name: 'The Doors of Perception' },
            { id: 9, name: 'Alice in Wonderland' }
        ];

    }]);

})(window);