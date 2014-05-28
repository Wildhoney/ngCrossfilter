(function($angular, $crossfilter) {

    "use strict";

    /**
     * @module ngCrossfilter
     * @author Adam Timberlake
     * @link http://github.com/Wildhoney/ngCrossfilter
     */
    var ngCrossfilter = $angular.module('ngCrossfilter', []);

    /**
     * @module ngCrossfilter
     * @submodule CrossfilterService
     */
    ngCrossfilter.service('Crossfilter', function CrossfilterService() {

        /**
         * @module ngCrossfilter
         * @submodule ngCrossfilterService
         */
        var Service = function ngCrossfilterService(collection) {

            // Initialise the Crossfilter with the array of models.
            this._initialise(collection);

        };

        /**
         * @property prototype
         * @type {Object}
         */
        Service.prototype = {

            /**
             * @property collection
             * @type {crossfilter}
             */
            collection: {},

            /**
             * @method _initialise
             * @param collection {Array}
             * @return {void}
             * @private
             */
            _initialise: function _initialise(collection) {},

            /**
             * @method filterBy
             * @param property {String}
             * @param value {String}
             * @param modifiers {String}
             * @return {void}
             */
            filterBy: function filterBy(property, value, modifiers) {},

            /**
             * @method unfilterBy
             * @param property {String}
             * @return {void}
             */
            unfilterBy: function unfilterBy(property) {},

            /**
             * @method sortBy
             * @param property {String}
             * @param value {String}
             * @return {void}
             */
            sortBy: function sortBy(property, value) {},

            /**
             * @method unsortBy
             * @param property {String}
             * @return {void}
             */
            unsortBy: function unsortBy(property) {}

        };

        return Service;

    });

})(window.angular, window.crossfilter);