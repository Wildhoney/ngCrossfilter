/**
 * @module ngCrossfilter
 * @author Adam Timberlake
 * @link https://github.com/Wildhoney/ngCrossfilter
 *
 * @param $angular Angular.js      https://angularjs.org/                      (Required)
 * @param $crossfilter             https://github.com/square/crossfilter       (Required)
 * @param $moment                  http://momentjs.com/
 * @param _                        http://underscorejs.org/
 */
(function ngCrossfilterBootstrap($angular, $crossfilter, $moment, _) {

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
        _throwException("ngCrossfilter Requires Angular.js");

    }

    if (typeof $crossfilter === 'undefined') {

        // Add a check for Crossfilter.
        _throwException("ngCrossfilter Requires Crossfilter");

    }

    /**
     * @module ngCrossfilter
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngCrossfilter
     */
    var ngCrossfilter = $angular.module('ngCrossfilter', []);

    /**
     * @module ngCrossfilter
     * @submodule CrossfilterService
     */
    ngCrossfilter.service('Crossfilter', ['$rootScope', '$timeout', '$window',

        /*jshint maxstatements: 50 */
        function CrossfilterService($rootScope, $timeout, $window) {

            /**
             * @module ngCrossfilter
             * @submodule ngCrossfilterService
             * @constructor
             */
            var Service = function ngCrossfilterService(collection, primaryKey, strategy, properties) {

                // Determine if we can utilise Underscore.js for badly supported functionality,
                // also create an alias for the `_isArray` method.
                this.filters.HAS_UNDERSCORE = (typeof _ !== 'undefined');
                this.filters._isArray = this._isArray;

                // Reset all of the arrays and objects.
                this._resetAll();

                // Initialise the Crossfilter with the array of models.
                this._initialise(collection, primaryKey, strategy, properties);

                // Construct the initial array of items.
                this._applyChanges();

                // Following is a dirty hack to ensure the object masquerades as an array at all times!
                var masquerade       = [];
                masquerade.length    = collection.length;
                /*jshint proto: true */
                masquerade.__proto__ = this;
                return masquerade;

            };

            // Store a reference to the prototype.
            var SP = Service.prototype = [];

            /**
             * @constant STRATEGY_PERSISTENT
             * @type {String}
             */
            SP.STRATEGY_PERSISTENT = 'persistent';

            /**
             * @constant STRATEGY_TRANSIENT
             * @type {String}
             */
            SP.STRATEGY_TRANSIENT = 'transient';

            /**
             * @constant PRIMARY_DIMENSION
             * @type {String}
             */
            SP.PRIMARY_DIMENSION = '__primaryKey';

            /**
             * @property _crossfilter
             * @type {crossfilter}
             * @private
             */
            SP._crossfilter = {};

            /**
             * @property _cacheGroups
             * @type {Object}
             */
            SP._cacheGroups = {};

            /**
             * @property _isTiming
             * @type {Boolean}
             * @default false
             * @private
             */
            SP._isTiming = false;

            /**
             * @property _dimensions
             * @type {Object}
             * @private
             */
            SP._dimensions = {};

            /**
             * @property _primaryKey
             * @type {String}
             * @private
             */
            SP._primaryKey = '';

            /**
             * @property _sortProperty
             * @type {String}
             * @private
             */
            SP._sortProperty = '';

            /**
             * @property _isAscending
             * @type {Boolean}
             * @default true
             * @private
             */
            SP._isAscending = true;

            /**
             * @property _lastFilter
             * @type {String}
             * @private
             */
            SP._lastFilter = '';

            /**
             * @property strategy
             * @type {String}
             * @private
             */
            SP._strategy = '';

            /**
             * @property _debug
             * @type {Boolean}
             * @default false
             * @private
             */
            SP._debug = false;

            /**
             * List of common filters bundled into ngCrossfilter.
             *
             * @property filters
             * @type {Object}
             */
            SP.filters = {

                /**
                 * @constant HAS_UNDERSCORE
                 * @type {Boolean}
                 */
                HAS_UNDERSCORE: false,

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
                 * @param comparatorFunction {Function}
                 * @return {Function}
                 */
                dateTimeRange: function dateTimeRangeFilter(format, comparatorFunction) {

                    if (typeof $moment === 'undefined') {

                        // Ensure we have the Moment.js library installed.
                        _throwException("You need to install Moment.js to use dateTimeRange");

                    }

                    /**
                     * @method fuzzy
                     * @param expected {String}
                     * @param actual {String}
                     * @return {Boolean}
                     */
                    return function dateTimeRange(expected, actual) {

                        // Convert each date/time into a Unix timestamp.
                        var start   = (expected[0] === -Infinity) ? 0 : $moment(expected[0], format).unix(),
                            end     = (expected[1] === Infinity)  ? Infinity : $moment(expected[1], format).unix(),
                            current = $moment(actual, format).unix();

                        if (start < 0 || end < 0 || current < 0) {

                            // Ensure we're not dealing with overtly incorrect dates/times.
                            _throwException("Date/Time parsing appears to be using invalid format");

                        }

                        if (typeof comparatorFunction === 'function') {

                            // Use the user specified comparator function if it has been defined.
                            return comparatorFunction(current, start, end);

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
                        var result = (expected & actual);
                        return (flag === '!') ? !result : result;
                    }

                },

                /**
                 * @method inArray
                 * @param method {String}
                 * @return {Function}
                 */
                inArray: function inArray(method) {
                    return this._inArray(method, false);
                },

                /**
                 * @method notInArray
                 * @param method {String}
                 * @return {Function}
                 */
                notInArray: function notInArray(method) {
                    return this._inArray(method, true);
                },

                /**
                 * @method _inArray
                 * @param method {String}
                 * @param invertInArray {Boolean}
                 * @return {Function}
                 * @private
                 */
                _inArray: function inArrayFilter(method, invertInArray) {

                    var hasUnderscore = this.HAS_UNDERSCORE,
                        isArray       = this._isArray;

                    /**
                     * @method inArray
                     * @param expected {String|Number|Array}
                     * @param actual {Array}
                     * @return {Boolean}
                     */
                    return function inArray(expected, actual) {

                        if (!isArray(actual)) {
                            _throwException("Using inArray filter on a non-array like property");
                        }

                        if (!isArray(expected)) {

                            // Convert the expected into an array if it isn't already.
                            expected = [expected];

                        }

                        // Assign a default if none specified.
                        method = method || 'every';

                        if (method && ['every', 'some'].indexOf(method) === -1) {
                            _throwException("You must pass either 'every' or 'some'");
                        }

                        if (!hasUnderscore && (typeof [].every !== 'function' || typeof [].some !== 'function')) {
                            _throwException("Browser does not support `every` and/or `some` methods");
                        }

                        /**
                         * @method everySome
                         * @param property {String|Number|Boolean}
                         * @return {Boolean}
                         */
                        var everySome = function everySome(property) {
                            var result = (actual.indexOf(property) !== -1);
                            return (invertInArray) ? !result : result;
                        };

                        // Use Underscore if available, otherwise native.
                        return hasUnderscore ? _[method](expected, everySome) : expected[method](everySome);

                    }

                }

            };

            /**
             * @method _initialise
             * @param collection {Array}
             * @param primaryKey {String}
             * @param strategy {String} Either "persistent" or "transient"
             * @param properties {Array} List of properties for the dimensions
             * @return {void}
             * @private
             */
            SP._initialise = function _initialise(collection, primaryKey, strategy, properties) {

                if (!this._isArray(collection)) {

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
                this._crossfilter = $crossfilter(collection);
                this._strategy    = strategy;
                this._primaryKey  = primaryKey || properties[0];

                /**
                 * @method createDimension
                 * @param name {String}
                 * @param property {String}
                 * @return {void}
                 */
                var createDimension = function createDimension(name, property) {

                    this._dimensions[name] = this._crossfilter.dimension(function(model) {
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

            };

            /**
             * @method filterBy
             * @param property {String}
             * @param expected {String}
             * @param customFilter {Function}
             * @return {void}
             */
            SP.filterBy = function filterBy(property, expected, customFilter) {

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

                // Store the last filter property to allowing filtering transiently.
                this._lastFilter = property;

                if (typeof customFilter === 'function') {

                    // Filter using the developer's custom function if it's been defined.
                    this._dimensions[property].filterFunction(function customFilterFunction(actual) {
                        return customFilter(expected, actual);
                    });

                    this._applyChanges();
                    return;

                }

                // Let's filter by the desired filter!
                this._dimensions[property].filter(expected);

                // Voila!
                this._applyChanges();

            };

            /**
             * @method unfilterBy
             * @param property {String}
             * @return {void}
             */
            SP.unfilterBy = function unfilterBy(property) {

                this._assertDimensionExists(property);
                this._prepareChanges();
                this._dimensions[property].filterAll();
                this._applyChanges();

            };

            /**
             * @method unfilterAll
             * @return {void}
             */
            SP.unfilterAll = function unfilterAll() {

                this._prepareChanges();

                // Clear all of the dimensions that we have.
                for (var key in this._dimensions) {

                    // Usual suspect!
                    if (this._dimensions.hasOwnProperty(key)) {
                        this._dimensions[key].filterAll();
                    }

                }

                this._applyChanges();

            };

            /**
             * @method sortBy
             * @param property {String}
             * @param isAscending {Boolean}
             * @return {void}
             */
            SP.sortBy = function sortBy(property, isAscending) {

                this._assertDimensionExists(property);
                this._prepareChanges();

                if (typeof isAscending === 'boolean') {

                    // Use the sorting specified by the developer.
                    this._isAscending  = isAscending;
                    this._sortProperty = property;
                    this._applyChanges();
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
                this._applyChanges();

            };

            /**
             * @method unsortAll
             * @param maintainSortOrder {Boolean}
             * @return {void}
             */
            SP.unsortAll = function unsortAll(maintainSortOrder) {

                this._prepareChanges();

                // Sort by the default property, which is the primary key.
                this._sortProperty = this._primaryKey;

                if (maintainSortOrder !== true) {

                    // Reset the sort order unless otherwise instructed.
                    this._isAscending = true;

                }

                this._applyChanges();

            };

            /**
             * @method addDimension
             * @param name {String}
             * @param setupFunction {Function}
             * @return {void}
             */
            SP.addDimension = function addDimension(name, setupFunction) {

                // Assume a default setup method if none has been specified.
                setupFunction = setupFunction || function dimensionSetup(model) {
                    return model[name];
                };

                this._assertValidDimensionName(name);
                this._dimensions[name] = this._crossfilter.dimension(setupFunction);

            };

            /**
             * @method deleteDimension
             * @param name {String}
             * @return {void}
             */
            SP.deleteDimension = function deleteDimension(name) {
                this._assertDimensionExists(name);
                this._dimensions[name].dispose();
                delete this._dimensions[name];
            };

            /**
             * @method first
             * @return {Object}
             */
            SP.first = function first() {
                return this[0];
            };

            /**
             * @method last
             * @return {Object}
             */
            SP.last = function last() {
                return this[this.length - 1];
            };

            /**
             * @method countBy
             * @param property {String}
             * @param value {String}
             * @return {Number}
             */
            SP.countBy = function countBy(property, value) {

                if (this._cacheGroups[property]) {

                    // Firstly we need to attempt to return the cached version.
                    return this._cacheGroups[property][value] || 0;

                }

                this._timerManager();
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
                this._timerManager();

                return groups[value] || 0;

            };

            /**
             * @method groupBy
             * @param property {String}
             * @return {Array}
             */
            SP.groupBy = function groupBy(property) {

                this._assertDimensionExists(property);

                return this._dimensions[property].group(function group(property) {
                    return property;
                }).all();

            };

            /**
             * @method models
             * @param offset {Number}
             * @param length {Number}
             * @return {Array}
             */
            SP.models = function models(offset, length) {
                var slice = this._collection(typeof length === 'number' ? length : Infinity);
                return slice.splice(typeof offset === 'number' ? offset : Infinity);
            };

            /**
             * @method addModel
             * @param model {Object}
             * @return {Number}
             */
            SP.addModel = function addModel(model) {
                return this.addModels([model]);
            };

            /**
             * @method addModels
             * @param models {Array}
             * @return {Number}
             */
            SP.addModels = function addModels(models) {
                this._crossfilter.add(models);
                this._applyChanges();
                return models.length;
            };

            /**
             * @property deleteModel
             * @param model {Object}
             * @return {Number}
             */
            SP.deleteModel = function deleteModel(model) {
                return this.deleteModels([model]);
            };

            /**
             * @property deleteModels
             * @param models {Array}
             * @return {Number}
             */
            SP.deleteModels = function deleteModel(models) {

                var deleteKeys = this._getKeys(models);

                // Use the special primary key dimension to remove the model(s).
                this._dimensions[this.PRIMARY_DIMENSION].filter(function filter(property) {
                    return (deleteKeys.indexOf(property) === -1);
                });

                this._applyChanges();
                return deleteKeys.length;

            };

            /**
             * @method debugMode
             * @param state {Boolean}
             * @return {void}
             */
            SP.debugMode = function debugMode(state) {
                this._debug = !!state;
            };

            /**
             * @method crossfilter
             * @return {crossfilter}
             */
            SP.crossfilter = function crossfilter() {
                return this._crossfilter;
            };

            /**
             * @method _collection
             * @param limit {Number}
             * @return {Array|Service}
             * @private
             */
            SP._collection = function _collection(limit) {

                var sortProperty = this._sortProperty || this._primaryKey,
                    sortOrder    = this._isAscending ? 'bottom' : 'top';

                if (typeof this._dimensions[sortProperty] === 'undefined') {
                    return this;
                }

                return this._dimensions[sortProperty][sortOrder](limit || Infinity);

            };

            /**
             * @method _prepareChanges
             * @return {void}
             * @private
             */
            SP._prepareChanges = function _prepareChanges() {

                this._timerManager();

                // Invalidate the groups cache.
                this._cacheGroups = {};

                // Broadcast the changes to the masses!
                this._broadcastChanges();

            };

            /**
             * Responsible for emptying the array, and then reapplying use the current filters
             * and their states.
             *
             * @method _applyChanges
             * @return {void}
             * @private
             */
            SP._applyChanges = function _applyChanges() {

                // Use the nifty way of emptying an array.
                this.length = 0;

                var collection = this._collection(Infinity);

                // Apply all of the models to the collection.
                for (var key in collection) {

                    if (collection.hasOwnProperty(key)) {
                        this.push(collection[key]);
                    }

                }

                this._timerManager();

            };

            /**
             * @method _broadcastChanges
             * @param useTimeout {Boolean}
             * @return {void}
             * @private
             */
            SP._broadcastChanges = function _broadcastChanges(useTimeout) {

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

            };

            /**
             * @method _assertDimensionExists
             * @param property {String}
             * @return {void}
             * @private
             */
            SP._assertDimensionExists = function _assertDimensionExists(property) {

                if (typeof this._dimensions[property] === 'undefined') {

                    // Ensure we can find the dimension.
                    _throwException("Unable to find dimension named '" + property + "'");

                }

            };

            /**
             * @method _assertValidDimensionName
             * @param name {String}
             * @return {void}
             * @private
             */
            SP._assertValidDimensionName = function _assertValidDimensionName(name) {

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

            };

            /**
             * @method _timerManager
             * @return {void}
             * @private
             */
            SP._timerManager = function _timerManager() {

                if (!this._debug) {
                    return;
                }

                // Determine whether we're beginning the timing, or ending it. We'll then invert the
                // `_isTiming` boolean, and calculate the duration.
                var method = this._isTiming ? 'time' : 'timeEnd';
                this._isTiming = !this._isTiming;
                $window.console[method]('timeTaken');

            };

            /**
             * @method _getProperties
             * @param model {Object}
             * @return {Array}
             * @private
             */
            SP._getProperties = function _getProperties(model) {

                var properties = [];

                for (var property in model) {

                    if (model.hasOwnProperty(property)) {
                        properties.push(property);
                    }

                }

                return properties;

            };

            /**
             * @method _getKeys
             * @param models
             * @returns {Array}
             * @private
             */
            SP._getKeys = function _getKeys(models) {

                var keys = [];

                $angular.forEach(models, function forEach(model) {

                    var primaryKey = model[this._primaryKey];

                    if (typeof primaryKey === 'undefined') {

                        // Ensure the primary key is valid.
                        _throwException("Unable to find the primary key in model: '" + this._primaryKey + "'");

                    }

                    keys.push(primaryKey);

                }.bind(this));

                return keys;

            };

            /**
             * @method _isArray
             * @return {Boolean}
             * @private
             */
            SP._isArray = function _isArray(item) {

                if (typeof $window.Array.isArray === 'function') {
                    return $window.Array.isArray(item);
                }

                if (typeof _ !== 'undefined') {
                    return _.isArray(item);
                }

                /* jshint -W122 */
                return (typeof item === '[object Array]');

            };

            /**
             * @method _resetAll
             * @return {void}
             * @private
             */
            SP._resetAll = function _resetAll() {

                this._crossfilter = {};
                this._cacheGroups = {};
                this._dimensions  = {};

            };

            /**
             * @method toString
             * @return {String}
             */
            SP.toString = function toString() {
                return '[object Array]';
            };

            return Service;

        }]);

})(window.angular, window.crossfilter, window.moment, window._);