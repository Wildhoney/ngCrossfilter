(function($window) {

    /**
     * @controller WordsController
     */
    $window.app.controller('WordsController', function wordsController($scope, $http, Crossfilter) {

        /**
         * @property words
         * @type {Object}
         */
        $scope.words = {};

        /**
         * @property word
         * @type {String}
         */
        $scope.word = '';

        // Fetch all of the words to create the Crossfilter from.
        $http.get('words.json').then(function then(response) {

            // Voila!
            $scope.words = new Crossfilter(response.data, 'id', 'persistent');

        });

//        /**
//         * @method filterInvert
//         * @param dimension {Object}
//         * @return {Boolean}
//         */
//        $scope.filterInvert = function filterInvert(dimension) {
//
////            return dimension.
//
//        }

    });

})(window);