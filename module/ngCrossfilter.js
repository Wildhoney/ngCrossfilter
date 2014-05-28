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
     * @submodule CrossfilterFilter
     */
    ngCrossfilter.filter('crossfilter', function CrossfilterFilter() {

        return function ngCrossfilterFilter(collection) {

            return [1, 2, 3];

        };

    });

    /**
     * @module ngCrossfilter
     * @submodule CrossfilterService
     */
    ngCrossfilter.service('Crossfilter', function CrossfilterService() {

        /**
         * @module ngCrossfilter
         * @submodule ngCrossfilterService
         */
        var Service = function ngCrossfilterService(collection, primaryKey) {

            // Initialise the Crossfilter with the array of models.
            this._initialise(collection, primaryKey);

        };

        /**
         * @property prototype
         * @type {Object}
         */
        Service.prototype = {

            /**
             * @property collection
             * @type {crossfilter}
             * @private
             */
            _collection: {},

            /**
             * @property _dimensions
             * @type {Array}
             * @private
             */
            _dimensions: [],

            /**
             * @property _primaryKey
             * @type {String|null}
             * @private
             */
            _primaryKey: null,

            /**
             * @method _initialise
             * @param collection {Array}
             * @param primaryKey {String}
             * @return {void}
             * @private
             */
            _initialise: function _initialise(collection, primaryKey) {

                // Discover the unique properties in the collection.
                var properties = this._getProperties(collection[0]),
                    dimensions = this._dimensions;

                // Initialise the Crossfilter collection, with the primary key.
                this._collection = $crossfilter(collection);
                this._primaryKey = primaryKey || properties[0];

                    // Iterate over each property to create its related dimension.
                $angular.forEach(properties, function(property) {

                    dimensions[property] = _crossfilter.dimension(function(model) {
                        return model[property];
                    });

                });

            },

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
            unsortBy: function unsortBy(property) {},

            /**
             * @method pageNext
             * @return {void}
             */
            pageNext: function pageNext() {},

            /**
             * @method pagePrevious
             * @return {void}
             */
            pagePrevious: function pagePrevious() {},

            /**
             * @method pageLimit
             * @param limit {Number}
             * @return {void}
             */
            pageLimit: function(limit) {},

            /**
             * @method pageNumber
             * @param number {Number}
             * @return {void}
             */
            pageNumber: function pageNumber(number) {},

            /**
             * @method _getProperties
             * @param model {Object}
             * @return {Array}
             * @private
             */
            _getProperties: function _getProperties(model) {

                var properties = [];

                for (var property in model) {

                    if (model.hasOwnProperty(property)) {
                        properties.push(property);
                    }

                }

                return properties;

            }

        };

        return Service;

    });

})(window.angular, window.crossfilter);