(function($angular, $crossfilter, $array) {

    "use strict";

    /**
     * @method _throwException
     * @param message {String}
     * @return {void}
     * @private
     */
    var _throwException = function _throwException(message) {
        throw "ngCrossfilter: " + message + ".";
    };

    if (typeof $angular === 'undefined') {

        // Add a check for Angular.
        _throwException("Angular dependency is a requirement");

    }

    if (typeof $crossfilter === 'undefined') {

        // Add a check for Crossfilter.
        _throwException("Crossfilter dependency is a requirement");

    }

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

        return function ngCrossfilterFilter(crossfilter) {

            console.log('Here');

            if (typeof crossfilter._collection === 'undefined') {

                // If we're not dealing with a Crossfilter, then we'll
                // return it immediately.
                return crossfilter;

            }

            // Find the sort key and the sort order.
            var sortProperty = crossfilter._sortProperty || crossfilter._primaryKey,
                sortOrder    = crossfilter._sortOrder || 'top';

            return crossfilter._dimensions[sortProperty][sortOrder](Infinity);

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
        var Service = function ngCrossfilterService(collection, primaryKey, strategy) {

            // Initialise the Crossfilter with the array of models.
            this._initialise(collection, primaryKey, strategy);

        };

        /**
         * @property prototype
         * @type {Object}
         */
        Service.prototype = {

            /**
             * @constant STRATEGIES
             * @type {Object}
             */
            STRATEGIES: { keep: 'persistent', clear: 'transient' },

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
             * @property _sortProperty
             * @type {String}
             * @private
             */
            _sortProperty: '',

            /**
             * @property _sortOrder
             * @type {String}
             * @default top
             * @private
             */
            _sortOrder: 'top',

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
            _strategy: '',

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
                    _throwException("Collection must be an array");

                }

                // Assume a default strategy if one hasn't been defined.
                strategy = strategy || this.STRATEGIES.keep;

                if ([this.STRATEGIES.keep, this.STRATEGIES.clear].indexOf(strategy) === -1) {

                    // Determine if the strategy has been defined as either persistent or transient.
                    _throwException("Strategy must be either '" + this.STRATEGIES.keep + "' or '" + this.STRATEGIES.clear + "'");

                }

                // Discover the unique properties in the collection.
                var properties = this._getProperties(collection[0]);

                // Initialise the Crossfilter collection, and either use the defined primary key, or infer
                // it from the properties.
                this._collection = $crossfilter(collection);
                this._strategy   = strategy;
                this._primaryKey = primaryKey || properties[0];

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
                    throw _throwException("Custom filter method must be a function");

                }

                if (this._lastFilter && this._strategy === this.STRATEGIES.clear) {

                    // Clear the previous filter if we're using the transient strategy.
                    this.unfilterBy(this._lastFilter);

                    // Store the last filter so we can filter anew.
                    this._lastFilter = property;

                }

                if (typeof customFilter === 'function') {

                    // Filter using the developer's custom function if it's been defined.
                    this._dimensions[property].filterFunction(customFilter);
                    return;

                }

                // Let's filter by the desired filter!
                this._dimensions[property].filter(value);

            },

            /**
             * @method unfilterBy
             * @param property {String}
             * @return {void}
             */
            unfilterBy: function unfilterBy(property) {

                if (typeof this._dimensions[property] === 'undefined') {

                    // Ensure we can find the dimension.
                    _throwException("Unable to find dimension named '" + property + "'");

                }

                this._dimensions[property].filterAll();

            },

            /**
             * @method unfilterAll
             * @return {void}
             */
            unfilterAll: function unfilterAll() {

                // Clear all of the dimensions that we have.
                $angular.forEach(this._dimensions, function forEach(dimension) {
                    dimension.filterAll();
                });

            },

            /**
             * @method sortBy
             * @param property {String}
             * @param direction {String}
             * @return {void}
             */
//            sortBy: function sortBy(property, direction) {},
//
//            /**
//             * @method unsortBy
//             * @param property {String}
//             * @return {void}
//             */
//            unsortBy: function unsortBy(property) {},
//
//            /**
//             * @method pageNext
//             * @return {void}
//             */
//            pageNext: function pageNext() {},
//
//            /**
//             * @method pagePrevious
//             * @return {void}
//             */
//            pagePrevious: function pagePrevious() {},
//
//            /**
//             * @method pageLimit
//             * @param limit {Number}
//             * @return {void}
//             */
//            pageLimit: function(limit) {},
//
//            /**
//             * @method pageNumber
//             * @param number {Number}
//             * @return {void}
//             */
//            pageNumber: function pageNumber(number) {},

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

})(window.angular, window.crossfilter, window.Array);