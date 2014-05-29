(function($window, $RegExp) {

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

        /**
         * @property loading
         * @type {Boolean}
         */
        $scope.loading = true;

        /**
         * @property pageNumber
         * @type {Number}
         * @default 10
         */
        $scope.pageNumber = 10;

        // Fetch all of the words to create the Crossfilter from.
        $http.get('words.json').then(function then(response) {

            // Voila!
            $scope.words = new Crossfilter(response.data, 'id', 'persistent');
            $scope.words.debugMode(true);
            $scope.loading = false;

        });

        /**
         * @method applyWordFilter
         * @param word {String}
         * @param customFilter {Function}
         * @return {void}
         */
        $scope.applyWordFilter = function applyWordFilter(word, customFilter) {
            $scope.pageNumber = 10;
            $scope.words.filterBy('word', word, customFilter);
            $scope.word = word;
        };

        /**
         * @method fuzzyFilter
         * @param expected {String}
         * @param actual {String}
         * @return {Boolean}
         */
        $scope.fuzzyFilter = function fuzzyFilter(expected, actual) {
            var regExp = new $RegExp(expected, 'i');
            return !!actual.match(regExp);
        }

    });

})(window, window.RegExp);