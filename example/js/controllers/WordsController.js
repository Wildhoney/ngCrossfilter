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

        // Fetch all of the words to create the Crossfilter from.
        $http.get('words.json').then(function then(response) {

            // Voila!
            $scope.words = new Crossfilter(response.data, 'id', 'persistent');
            $scope.words.debugMode(true);
            $scope.loading = false;

        });

        /**
         * @method fuzzyFilter
         * @param property {String}
         * @return {Boolean}
         */
        $scope.fuzzyFilter = function fuzzyFilter(property) {

            var regExp = new $RegExp($scope.word);
            return !!property.match(regExp, 'i');

        }

    });

})(window, window.RegExp);