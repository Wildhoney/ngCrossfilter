(function($angular, $crossfilter, $array) {

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
         * @constructor
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
             * @type {String}
             * @private
             */
            _primaryKey: '',

            /**
             * @property _lastFilter
             * @type {String}
             * @private
             */
            _lastFilter: '',

            /**
             * @property strategy
             * @type {String}
             * @return {void}
             */
            _strategy: 'persistent',

            /**
             * @method _initialise
             * @param collection {Array}
             * @param primaryKey {String}
             * @param strategy {String} Either "persistent" or "transient"
             * @return {void}
             * @private
             */
            _initialise: function _initialise(collection, primaryKey, strategy) {

                if (typeof $array.isArray === 'function' && !$array.isArray(collection)) {

                    // Determine if the collection is a valid array.
                    this._throwException("Collection must be an array");

                }

                if (typeof strategy !== 'undefined' && ['persistent', 'transient'].indexOf(strategy) === -1) {

                    // Determine if the strategy has been defined as either persistent or transient.
                    this._throwException("Strategy must be either 'persistent' or 'transient'");

                }

                // Discover the unique properties in the collection.
                var properties = this._getProperties(collection[0]);

                // Initialise the Crossfilter collection, with the primary key.
                this._collection = $crossfilter(collection);
                this._primaryKey = primaryKey || properties[0];
                this._strategy   = strategy;

                // Iterate over each property to create its related dimension.
                $angular.forEach(properties, function(property) {

                    this._dimensions[property] = this._collection.dimension(function(model) {
                        return model[property];
                    });

                }.bind(this));

            },

            /**
             * @method filterBy
             * @param property {String}
             * @param value {String}
             * @param customFilter {Function}
             * @return {void}
             */
            filterBy: function filterBy(property, value, customFilter) {

                if (typeof customFilter !== 'undefined' && typeof customFilter !== 'function') {

                    // Ensure the third argument is a function, if it has been defined.
                    throw this._throwException("Custom filter method must be a function");

                }

                // Store the last filter so we can filter anew.
                this._lastFilter = property;

            },

            /**
             * @method unfilterBy
             * @param property {String}
             * @return {void}
             */
            unfilterBy: function unfilterBy(property) {},

            /**
             * @method sortBy
             * @param property {String}
             * @param direction {String}
             * @return {void}
             */
            sortBy: function sortBy(property, direction) {},

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

            },

            /**
             * @method _throwException
             * @param message {String}
             * @return {void}
             * @private
             */
            _throwException: function _throwException(message) {
                throw "ngCrossfilter: " + message + ".";
            }

        };

        return Service;

    });

})(window.angular, window.crossfilter, window.Array);