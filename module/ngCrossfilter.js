(function($angular, $crossfilter, $array, $console, $moment) {

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

            if (typeof crossfilter._collection === 'undefined') {

                // If we're not dealing with a Crossfilter, then we'll
                // return it immediately.
                return crossfilter;

            }

            if (crossfilter._cacheCollection.length &&
                crossfilter._iterations.current === crossfilter._iterations.previous) {

                // Respond with the cached collection if the iterators are identical.
                return crossfilter._cacheCollection;

            }

            if (crossfilter._debug) {

                // Enable the timing if debug mode is enabled.
                $console.time('timeTaken');

            }

            // Find the sort key and the sort order.
            var collection = crossfilter.getCollection();

            // Store a cached version of the collection, and update the iteration.
            crossfilter._cacheCollection = collection;
            crossfilter._iterations.previous = crossfilter._iterations.current;

            if (crossfilter._debug) {
                $console.timeEnd('timeTaken');
            }

            return collection;

        };

    });

    /**
     * @module ngCrossfilter
     * @submodule CrossfilterService
     */
    ngCrossfilter.service('Crossfilter', ['$rootScope', '$timeout', '$window',

    function CrossfilterService($rootScope, $timeout, $window) {

        /**
         * @module ngCrossfilter
         * @submodule ngCrossfilterService
         * @constructor
         */
        var Service = function ngCrossfilterService(collection, primaryKey, strategy, properties) {

            // Reset all of the arrays and objects.
            this._resetAll();

            // Initialise the Crossfilter with the array of models.
            this._initialise(collection, primaryKey, strategy, properties);

        };

        /**
         * @property prototype
         * @type {Object}
         */
        Service.prototype = {

            /**
             * @constant STRATEGY_PERSISTENT
             * @type {String}
             */
            STRATEGY_PERSISTENT: 'persistent',

            /**
             * @constant STRATEGY_TRANSIENT
             * @type {String}
             */
            STRATEGY_TRANSIENT: 'transient',

            /**
             * @constant PRIMARY_DIMENSION
             * @type {String}
             */
            PRIMARY_DIMENSION: '__primaryKey',

            /**
             * @property collection
             * @type {crossfilter}
             * @private
             */
            _collection: {},

            /**
             * @property _cacheCollection
             * @type {Array}
             */
            _cacheCollection: [],

            /**
             * @property _cacheGroups
             * @type {Object}
             */
            _cacheGroups: {},

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
             * @property _isAscending
             * @type {Boolean}
             * @default true
             * @private
             */
            _isAscending: true,

            /**
             * @property _lastFilter
             * @type {String}
             * @private
             */
            _lastFilter: '',

            /**
             * @property strategy
             * @type {String}
             * @private
             */
            _strategy: '',

            /**
             * @property _iterations
             * @type {Object}
             * @private
             */
            _iterations: { current: 1, previous: 1 },

            /**
             * @property _debug
             * @type {Boolean}
             * @default false
             * @private
             */
            _debug: false,

            /**
             * List of common filters bundled into ngCrossfilter.
             *
             * @property filters
             * @type {Object}
             */
            filters: {

                /**
                 * @method fuzzy
                 * @param flags {String}
                 * @return {Function}
                 */
                fuzzy: function fuzzyFilter(flags) {

                    /**
                     * @method fuzzy
                     * @param expected {String}
                     * @param actual {String}
                     * @return {Boolean}
                     */
                    return function fuzzy(expected, actual) {
                        var regExp = new $window.RegExp(expected, flags);
                        return !!actual.match(regExp);
                    };

                },

                /**
                 * @method dateTimeRange
                 * @param format {String}
                 * @return {Function}
                 */
                dateTimeRange: function dateTimeRangeFilter(format) {

                    /**
                     * @method fuzzy
                     * @param expected {String}
                     * @param actual {String}
                     * @return {Boolean}
                     */
                    return function dateTimeRange(expected, actual) {

                        if (typeof $moment === 'undefined') {

                            // Ensure we have the Moment.js library installed.
                            _throwException("You need to install Moment.js to use dateTimeRange");

                        }

                        // Convert each date/time into a Unix timestamp.
                        var start   = $moment(expected[0], format).unix(),
                            end     = $moment(expected[1], format).unix(),
                            current = $moment(actual, format).unix();

                        if (start < 0 || end < 0 || current < 0) {

                            // Ensure we're not dealing with overtly incorrect dates/times.
                            _throwException("Date/Time parsing appears to be using invalid format");

                        }

                        return (current >= start && current <= end);

                    }

                },

                /**
                 * @method regexp
                 * @return {Function}
                 */
                regexp: function regexpFilter() {

                    /**
                     * @method regexp
                     * @param expected {String}
                     * @param actual {String}
                     * @return {Boolean}
                     */
                    return function regexp(expected, actual) {

                        if (!(expected instanceof $window.RegExp)) {
                            _throwException("Expression must be an instance of RegExp");
                        }

                        return !!actual.match(expected);

                    }

                },

                /**
                 * @method bitwise
                 * @param flag {String}
                 * @return {Function}
                 */
                bitwise: function bitwiseFilter(flag) {

                    /**
                     * @method bitwise
                     * @param expected {Number}
                     * @param actual {Number}
                     * @return {Boolean}
                     */
                    return function bitwise(expected, actual) {

                        if (flag === '!') {
                            return !(expected & actual);
                        }

                        return (expected & actual);

                    }

                },

                /**
                 * @method inArray
                 * @param method {String}
                 * @return {Function}
                 */
                inArray: function inArrayFilter(method) {

                    /**
                     * @method inArray
                     * @param expected {String|Number|Array}
                     * @param actual {Array}
                     * @return {Boolean}
                     */
                    return function inArray(expected, actual) {

                        if (typeof $array.isArray === 'function') {

                            if (!$array.isArray(actual)) {
                                _throwException("Using inArray filter on a non-array like property");
                            }

                            if (!$array.isArray(expected)) {

                                // Convert the expected into an array if it isn't already.
                                expected = [expected];

                            }

                        }

                        if (method && ['every', 'some'].indexOf(method) === -1) {
                            _throwException("You must pass either 'every' or 'some'");
                        }

                        if (typeof [].every !== 'function' || typeof [].some !== 'function') {
                            _throwException("Browser does not support `every` and/or `some` methods");
                        }

                        return expected[method || 'every'](function everySome(property) {
                            return (actual.indexOf(property) !== -1);
                        });

                    }

                }

            },

            /**
             * @method _initialise
             * @param collection {Array}
             * @param primaryKey {String}
             * @param strategy {String} Either "persistent" or "transient"
             * @param properties {Array} List of properties for the dimensions
             * @return {void}
             * @private
             */
            _initialise: function _initialise(collection, primaryKey, strategy, properties) {

                if (typeof $array.isArray === 'function' && !$array.isArray(collection)) {

                    // Determine if the collection is a valid array.
                    _throwException("Collection must be an array");

                }

                // Assume a default strategy if one hasn't been defined.
                strategy = strategy || this.STRATEGY_PERSISTENT;

                if ([this.STRATEGY_PERSISTENT, this.STRATEGY_TRANSIENT].indexOf(strategy) === -1) {

                    // Determine if the strategy has been defined as either persistent or transient.
                    _throwException("Strategy must be either '" +
                        this.STRATEGY_PERSISTENT + "' or '" +
                        this.STRATEGY_TRANSIENT + "'");

                }

                if ((primaryKey) && !(primaryKey in collection[0])) {

                    // Ensure the specified primary key is in the collection.
                    _throwException("Primary key '" + primaryKey + "' is not in the collection");

                }

                // Discover the unique properties in the collection.
                properties = properties || this._getProperties(collection[0]);

                // Initialise the Crossfilter collection, and either use the defined primary key, or infer
                // it from the properties.
                this._collection = $crossfilter(collection);
                this._strategy   = strategy;
                this._primaryKey = primaryKey || properties[0];

                /**
                 * @method createDimension
                 * @param name {String}
                 * @param property {String}
                 * @return {void}
                 */
                var createDimension = function createDimension(name, property) {

                    this._dimensions[name] = this._collection.dimension(function(model) {
                        return model[property || name];
                    });

                }.bind(this);

                $angular.forEach(properties, function(property) {

                    // Iterate over each property to create its related dimension.
                    createDimension(property);

                }.bind(this));

                // Add a special dimension for removing models.
                createDimension(this.PRIMARY_DIMENSION, this._primaryKey);

                // Broadcast the changes to the masses!
                this._broadcastChanges(true);

            },

            /**
             * @method filterBy
             * @param property {String}
             * @param value {String}
             * @param customFilter {Function}
             * @return {void}
             */
            filterBy: function filterBy(property, value, customFilter) {

                this._assertDimensionExists(property);

                if (typeof customFilter !== 'undefined' && typeof customFilter !== 'function') {

                    // Ensure the third argument is a function, if it has been defined.
                    throw _throwException("Custom filter method must be a function");

                }

                this._prepareChanges();

                if (this._lastFilter && this._strategy === this.STRATEGY_TRANSIENT) {

                    // Clear the previous filter if we're using the transient strategy.
                    this.unfilterBy(this._lastFilter);

                }

                // Store the last filter so we can filter anew.
                this._lastFilter = property;

                if (typeof customFilter === 'function') {

                    // Filter using the developer's custom function if it's been defined.
                    this._dimensions[property].filterFunction(function customFilterFunction(actual) {
                        return customFilter(value, actual);
                    });

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

                this._assertDimensionExists(property);
                this._prepareChanges();
                this._dimensions[property].filterAll();

            },

            /**
             * @method unfilterAll
             * @return {void}
             */
            unfilterAll: function unfilterAll() {

                this._prepareChanges();

                // Clear all of the dimensions that we have.
                for (var key in this._dimensions) {

                    // Usual suspect!
                    if (this._dimensions.hasOwnProperty(key)) {
                        this._dimensions[key].filterAll();
                    }

                }

            },

            /**
             * @method sortBy
             * @param property {String}
             * @param isAscending {Boolean}
             * @return {void}
             */
            sortBy: function sortBy(property, isAscending) {

                this._assertDimensionExists(property);
                this._prepareChanges();

                if (typeof isAscending === 'boolean') {

                    // Use the sorting specified by the developer.
                    this._isAscending  = isAscending;
                    this._sortProperty = property;
                    return;

                }

                // Use the primary key if the current sort property hasn't been set yet.
                var currentSortProperty = this._sortProperty || this._primaryKey;

                // Determine if we should invert what we currently have if we're using the same property
                // as previously.
                if (currentSortProperty === property) {
                    this._isAscending = !this._isAscending;
                }

                // Otherwise we'll simply update the sort property.
                this._sortProperty = property;

            },

            /**
             * @method unsortBy
             * @param property {String}
             * @param maintainSortOrder {Boolean}
             * @return {void}
             */
            unsortBy: function unsortBy(property, maintainSortOrder) {

                this._assertDimensionExists(property);
                this._prepareChanges();

                if (this._sortProperty !== property) {

                    // Ensure we're currently sorting by this property.
                    _throwException("Currently not sorting by property '" + property + "'");

                }

                // Sort by the default property, which is the primary key.
                this._sortProperty = this._primaryKey;

                if (maintainSortOrder !== true) {

                    // Reset the sort order unless otherwise instructed.
                    this._isAscending = true;

                }

            },

            /**
             * @method addDimension
             * @param name {String}
             * @param setupFunction {Function}
             * @return {void}
             */
            addDimension: function addDimension(name, setupFunction) {
                this._assertValidDimensionName(name);
                this._dimensions[name] = this._collection.dimension(setupFunction);
            },

            /**
             * @method deleteDimension
             * @param name {String}
             * @return {void}
             */
            deleteDimension: function deleteDimension(name) {
                this._assertDimensionExists(name);
                this._dimensions[name].dispose();
                delete this._dimensions[name];
            },

            /**
             * @method getCollection
             * @return {Array}
             */
            getCollection: function getCollection() {

                var sortProperty = this._sortProperty || this._primaryKey,
                    sortOrder    = this._isAscending ? 'bottom' : 'top';

                return this._dimensions[sortProperty][sortOrder](Infinity);

            },

            /**
             * @method getFirst
             * @return {Object}
             */
            getFirst: function getFirst() {
                return this.getModel(0);
            },

            /**
             * @method getLast
             * @return {Object}
             */
            getLast: function getLast() {
                return this.getModel(this.getCount() - 1);
            },

            /**
             * @method getModel
             * @return {Object}
             */
            getModel: function getModel(number) {
                return this.getCollection()[number];
            },

            /**
             * @method getModels
             * @alias getCollection
             * @return {Array}
             */
            getModels: function getModels() {
                return this.getCollection();
            },

            /**
             * @method countBy
             * @param property {String}
             * @param value {String}
             * @return {Number}
             */
            countBy: function countBy(property, value) {

                if (this._cacheGroups[property]) {

                    // Firstly we need to attempt to return the cached version.
                    return this._cacheGroups[property][value] || 0;

                }

                if (crossfilter._debug) {
                    $console.time('timeTaken');
                }

                this._assertDimensionExists(property);

                var groups = {};

                // Use reduce method to return the count for the dimension.
                var sums = this._dimensions[property].group().all();

                // Iterate over each sum model to package it nicely.
                for (var key in sums) {

                    // Usual suspect!
                    if (sums.hasOwnProperty(key)) {
                        var model = sums[key];
                        groups[model.key] = model.value;
                    }

                }

                // Store the cache for the next time, until it's invalidated by the `_prepareChanges`
                // method.
                this._cacheGroups[property] = groups;

                if (crossfilter._debug) {
                    $console.timeEnd('timeTaken');
                }

                return groups[value] || 0;

            },

            /**
             * @method groupBy
             * @param property {String}
             * @return {Array}
             */
            groupBy: function groupBy(property) {

                this._assertDimensionExists(property);

                return this._dimensions[property].group(function group(property) {
                    return property;
                }).all();

            },

            /**
             * @method addModel
             * @param model {Object}
             * @return {Number}
             */
            addModel: function addModel(model) {
                return this.addModels([model]);
            },

            /**
             * @method addModels
             * @param models {Array}
             * @return {Number}
             */
            addModels: function addModels(models) {
                this._collection.add(models);
                return models.length;
            },

            /**
             * @property deleteModel
             * @param model {Object}
             * @return {Number}
             */
            deleteModel: function deleteModel(model) {
                return this.deleteModels([model]);
            },

            /**
             * @property deleteModels
             * @param models {Array}
             * @return {Number}
             */
            deleteModels: function deleteModel(models) {

                var deleteKeys = [];

                $angular.forEach(models, function forEach(model) {

                    var primaryKey = model[this._primaryKey];

                    if (typeof primaryKey === 'undefined') {

                        // Ensure the primary key is valid.
                        _throwException("Unable to find the primary key in model: '" + this._primaryKey + "'");

                    }

                    deleteKeys.push(primaryKey);

                }.bind(this));

                // Use the special primary key dimension to remove the model(s).
                this._dimensions[this.PRIMARY_DIMENSION].filter(function filter(property) {
                    return (deleteKeys.indexOf(property) === -1);
                });

                return deleteKeys.length;

            },

            /**
             * @method getCount
             * @return {Number}
             */
            getCount: function getCount() {
                return this._cacheCollection.length || this.getCollection().length;
            },

            /**
             * @method debugMode
             * @param state {Boolean}
             * @return {void}
             */
            debugMode: function debugMode(state) {
                this._debug = !!state;
            },

            /**
             * @method _prepareChanges
             * @return {void}
             * @private
             */
            _prepareChanges: function _prepareChanges() {

                // Invalidate the groups cache.
                this._cacheGroups = {};

                // ...And then increment the current iteration.
                this._iterations.current++;

                // Broadcast the changes to the masses!
                this._broadcastChanges();

            },

            /**
             * @method _broadcastChanges
             * @param useTimeout {Boolean}
             * @return {void}
             * @private
             */
            _broadcastChanges: function _broadcastChanges(useTimeout) {

                /**
                 * @method broadcast
                 * @return {void}
                 */
                var broadcast = function broadcast() {

                    // Broadcast that the Crossfilter has been updated!
                    $rootScope.$broadcast('crossfilter/updated');

                };

                if (useTimeout) {
                    $timeout(broadcast, 1);
                    return;
                }

                broadcast();

            },

            /**
             * @method _assertDimensionExists
             * @param property {String}
             * @return {void}
             * @private
             */
            _assertDimensionExists: function _assertDimensionExists(property) {

                if (typeof this._dimensions[property] === 'undefined') {

                    // Ensure we can find the dimension.
                    _throwException("Unable to find dimension named '" + property + "'");

                }

            },

            /**
             * @method _assertValidDimensionName
             * @param name {String}
             * @return {void}
             * @private
             */
            _assertValidDimensionName: function _assertValidDimensionName(name) {

                // Ensure it doesn't use the special primary dimension.
                if (name === this.PRIMARY_DIMENSION) {
                    _throwException("Cannot define dimension using special dimension: '" + this.PRIMARY_DIMENSION + "'")
                }

                // Ensure it's a unique dimension name.
                for (var key in this._dimensions) {

                    if (key === name) {
                        _throwException("Cannot overwrite an existing dimension: '" + key + "'");
                    }

                }

            },

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
             * @method _resetAll
             * @return {void}
             * @private
             */
            _resetAll: function _resetAll() {

                this._collection      = {};
                this._cacheCollection = [];
                this._cacheGroups     = {};
                this._dimensions      = {};
                this._iterations      = { current: 1, previous: 1 };

            }

        };

        return Service;

    }]);

})(window.angular, window.crossfilter, window.Array, window.console, window.moment);