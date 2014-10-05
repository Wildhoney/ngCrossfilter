(function($window, $angular) {

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
         * @default 50
         */
        $scope.pageNumber = 50;

        /**
         * @property countGrouped
         * @type {Array}
         */
        $scope.countGrouped = [];

        /**
         * @property currentCountFilter
         * @type {Number}
         */
        $scope.currentCountFilter = 0;

        // When the Crossfilter collection has been updated.
        $scope.$on('crossfilter/updated', function crossfilterUpdated() {

            if ($angular.isDefined($scope.words.groupBy)) {
                $scope.countGrouped = $scope.words.groupBy('wordCount');
            }

        });

        /**
         * @method toggleCountFilter
         * @param count {Number}
         * @return {void}
         */
        $scope.toggleCountFilter = function toggleCountFilter(count) {

            if ($scope.currentCountFilter == count) {

                $scope.currentCountFilter = null;
                $scope.words.unfilterBy('wordCount');
                return;

            }

            $scope.currentCountFilter = count;
            $scope.words.filterBy('wordCount', count);

        };

        // Fetch all of the words to create the Crossfilter from.
        $http.get('words.json').then(function then(response) {

            // Voila!
            $scope.words = new Crossfilter(response.data, '$id', 'persistent');
            $scope.words.addDimension('wordCount', function wordCount(model) {
                return model.word.length;
            });

            $scope.countGrouped = $scope.words.groupBy('wordCount');
            $scope.loading = false;

        });

        /**
         * @method applyWordFilter
         * @param word {String}
         * @param customFilter {Function}
         * @return {void}
         */
        $scope.applyWordFilter = function applyWordFilter(word, customFilter) {

            $scope.pageNumber = 50;
            $scope.words.filterBy('word', word, customFilter);
            $scope.word = word;

        };

    });

})(window, window.angular);