(function ngCrossfilterBootstrap($angular, $crossfilter, $moment, _) {
        "use strict";
        var _throwException = function _throwException(message) {
            throw "ngCrossfilter: " + message + ".";
        };
        if (typeof $angular === 'undefined') {
            _throwException("Requires Angular.js: https:
    }

    if (typeof $crossfilter === 'undefined') {

                _throwException("
                Requires Crossfilter: https:
            }
            var ngCrossfilter = $angular.module('ngCrossfilter', []);
            ngCrossfilter.service('Crossfilter', ['$rootScope', '$timeout', '$window',
                function CrossfilterService($rootScope, $timeout, $window) {
                    var Service = function ngCrossfilterService(collection, primaryKey, strategy, properties) {
                        this.filters.HAS_UNDERSCORE = (typeof _ !== 'undefined');
                        this.filters._isArray = this._isArray;
                        this._resetAll();
                        this._initialise(collection, primaryKey, strategy, properties);
                        this._applyChanges();
                        var masquerade = [];
                        masquerade.length = collection.length;
                        masquerade.__proto__ = this;
                        return masquerade;
                    };
                    Service.prototype = [];
                    Service.prototype.STRATEGY_PERSISTENT = 'persistent';
                    Service.prototype.STRATEGY_TRANSIENT = 'transient';
                    Service.prototype.PRIMARY_DIMENSION = '__primaryKey';
                    Service.prototype._crossfilter = {};
                    Service.prototype._cacheGroups = {};
                    Service.prototype._dimensions = {};
                    Service.prototype._primaryKey = '';
                    Service.prototype._sortProperty = '';
                    Service.prototype._isAscending = true;
                    Service.prototype._lastFilter = '';
                    Service.prototype._strategy = '';
                    Service.prototype._debug = false;
                    Service.prototype.filters = {
                        HAS_UNDERSCORE: false,
                        fuzzy: function fuzzyFilter(flags) {
                            return function fuzzy(expected, actual) {
                                var regExp = new $window.RegExp(expected, flags);
                                return !!actual.match(regExp);
                            };
                        },
                        dateTimeRange: function dateTimeRangeFilter(format) {
                            if (typeof $moment === 'undefined') {
                                _throwException("You need to install Moment.js to use dateTimeRange");
                            }
                            return function dateTimeRange(expected, actual) {
                                var start = (expected[0] === -Infinity) ? 0 : $moment(expected[0], format).unix(),
                                    end = (expected[1] === Infinity) ? Infinity : $moment(expected[1], format).unix(),
                                    current = $moment(actual, format).unix();
                                if (start < 0 || end < 0 || current < 0) {
                                    _throwException("Date/Time parsing appears to be using invalid format");
                                }
                                return (current >= start && current <= end);
                            }
                        },
                        regexp: function regexpFilter() {
                            return function regexp(expected, actual) {
                                if (!(expected instanceof $window.RegExp)) {
                                    _throwException("Expression must be an instance of RegExp");
                                }
                                return !!actual.match(expected);
                            }
                        },
                        bitwise: function bitwiseFilter(flag) {
                            return function bitwise(expected, actual) {
                                var result = (expected & actual);
                                return (flag === '!') ? !result : result;
                            }
                        },
                        inArray: function inArrayFilter(method) {
                            var hasUnderscore = this.HAS_UNDERSCORE,
                                isArray = this._isArray;
                            return function inArray(expected, actual) {
                                if (!isArray(actual)) {
                                    _throwException("Using inArray filter on a non-array like property");
                                }
                                if (!isArray(expected)) {
                                    expected = [expected];
                                }
                                method = method || 'every';
                                if (method && ['every', 'some'].indexOf(method) === -1) {
                                    _throwException("You must pass either 'every' or 'some'");
                                }
                                if (!hasUnderscore && (typeof [].every !== 'function' || typeof [].some !== 'function')) {
                                    _throwException("Browser does not support `every` and/or `some` methods");
                                }
                                var everySome = function everySome(property) {
                                    return (actual.indexOf(property) !== -1);
                                };
                                return hasUnderscore ? _[method](expected, everySome) : expected[method](everySome);
                            }
                        }
                    };
                    Service.prototype._initialise = function _initialise(collection, primaryKey, strategy, properties) {
                        if (!this._isArray(collection)) {
                            _throwException("Collection must be an array");
                        }
                        strategy = strategy || this.STRATEGY_PERSISTENT;
                        if ([this.STRATEGY_PERSISTENT, this.STRATEGY_TRANSIENT].indexOf(strategy) === -1) {
                            _throwException("Strategy must be either '" + this.STRATEGY_PERSISTENT + "' or '" + this.STRATEGY_TRANSIENT + "'");
                        }
                        if ((primaryKey) && !(primaryKey in collection[0])) {
                            _throwException("Primary key '" + primaryKey + "' is not in the collection");
                        }
                        properties = properties || this._getProperties(collection[0]);
                        this._crossfilter = $crossfilter(collection);
                        this._strategy = strategy;
                        this._primaryKey = primaryKey || properties[0];
                        var createDimension = function createDimension(name, property) {
                            this._dimensions[name] = this._crossfilter.dimension(function(model) {
                                return model[property || name];
                            });
                        }.bind(this);
                        $angular.forEach(properties, function(property) {
                            createDimension(property);
                        }.bind(this));
                        createDimension(this.PRIMARY_DIMENSION, this._primaryKey);
                        this._broadcastChanges(true);
                    };
                    Service.prototype.filterBy = function filterBy(property, expected, customFilter) {
                        this._assertDimensionExists(property);
                        if (typeof customFilter !== 'undefined' && typeof customFilter !== 'function') {
                            throw _throwException("Custom filter method must be a function");
                        }
                        this._prepareChanges();
                        if (this._lastFilter && this._strategy === this.STRATEGY_TRANSIENT) {
                            this.unfilterBy(this._lastFilter);
                        }
                        this._lastFilter = property;
                        if (typeof customFilter === 'function') {
                            this._dimensions[property].filterFunction(function customFilterFunction(actual) {
                                return customFilter(expected, actual);
                            });
                            this._applyChanges();
                            return;
                        }
                        this._dimensions[property].filter(expected);
                        this._applyChanges();
                    };
                    Service.prototype.unfilterBy = function unfilterBy(property) {
                        this._assertDimensionExists(property);
                        this._prepareChanges();
                        this._dimensions[property].filterAll();
                        this._applyChanges();
                    };
                    Service.prototype.unfilterAll = function unfilterAll() {
                        this._prepareChanges();
                        for (var key in this._dimensions) {
                            if (this._dimensions.hasOwnProperty(key)) {
                                this._dimensions[key].filterAll();
                            }
                        }
                        this._applyChanges();
                    };
                    Service.prototype.sortBy = function sortBy(property, isAscending) {
                        this._assertDimensionExists(property);
                        this._prepareChanges();
                        if (typeof isAscending === 'boolean') {
                            this._isAscending = isAscending;
                            this._sortProperty = property;
                            this._applyChanges();
                            return;
                        }
                        var currentSortProperty = this._sortProperty || this._primaryKey;
                        if (currentSortProperty === property) {
                            this._isAscending = !this._isAscending;
                        }
                        this._sortProperty = property;
                        this._applyChanges();
                    };
                    Service.prototype.unsortBy = function unsortBy(property, maintainSortOrder) {
                        this._assertDimensionExists(property);
                        this._prepareChanges();
                        if (this._sortProperty !== property) {
                            _throwException("Currently not sorting by property '" + property + "'");
                        }
                        this._sortProperty = this._primaryKey;
                        if (maintainSortOrder !== true) {
                            this._isAscending = true;
                        }
                        this._applyChanges();
                    };
                    Service.prototype.addDimension = function addDimension(name, setupFunction) {
                        this._assertValidDimensionName(name);
                        this._dimensions[name] = this._crossfilter.dimension(setupFunction);
                    };
                    Service.prototype.deleteDimension = function deleteDimension(name) {
                        this._assertDimensionExists(name);
                        this._dimensions[name].dispose();
                        delete this._dimensions[name];
                    };
                    Service.prototype.first = function first() {
                        return this[0];
                    };
                    Service.prototype.last = function last() {
                        return this[this.length - 1];
                    };
                    Service.prototype.countBy = function countBy(property, value) {
                        if (this._cacheGroups[property]) {
                            return this._cacheGroups[property][value] || 0;
                        }
                        if (crossfilter._debug) {
                            $window.console.time('timeTaken');
                        }
                        this._assertDimensionExists(property);
                        var groups = {};
                        var sums = this._dimensions[property].group().all();
                        for (var key in sums) {
                            if (sums.hasOwnProperty(key)) {
                                var model = sums[key];
                                groups[model.key] = model.value;
                            }
                        }
                        this._cacheGroups[property] = groups;
                        if (crossfilter._debug) {
                            $window.console.timeEnd('timeTaken');
                        }
                        return groups[value] || 0;
                    };
                    Service.prototype.groupBy = function groupBy(property) {
                        this._assertDimensionExists(property);
                        return this._dimensions[property].group(function group(property) {
                            return property;
                        }).all();
                    };
                    Service.prototype.addModel = function addModel(model) {
                        return this.addModels([model]);
                    };
                    Service.prototype.addModels = function addModels(models) {
                        this._crossfilter.add(models);
                        this._applyChanges();
                        return models.length;
                    };
                    Service.prototype.deleteModel = function deleteModel(model) {
                        return this.deleteModels([model]);
                    };
                    Service.prototype.deleteModels = function deleteModel(models) {
                        var deleteKeys = [];
                        $angular.forEach(models, function forEach(model) {
                            var primaryKey = model[this._primaryKey];
                            if (typeof primaryKey === 'undefined') {
                                _throwException("Unable to find the primary key in model: '" + this._primaryKey + "'");
                            }
                            deleteKeys.push(primaryKey);
                        }.bind(this));
                        this._dimensions[this.PRIMARY_DIMENSION].filter(function filter(property) {
                            return (deleteKeys.indexOf(property) === -1);
                        });
                        this._applyChanges();
                        return deleteKeys.length;
                    };
                    Service.prototype.debugMode = function debugMode(state) {
                        this._debug = !!state;
                    };
                    Service.prototype._getCollection = function getCollection(limit) {
                        var sortProperty = this._sortProperty || this._primaryKey,
                            sortOrder = this._isAscending ? 'bottom' : 'top';
                        if (typeof this._dimensions[sortProperty] === 'undefined') {
                            return this;
                        }
                        return this._dimensions[sortProperty][sortOrder](limit || Infinity);
                    };
                    Service.prototype._prepareChanges = function _prepareChanges() {
                        if (this._debug) {
                            $window.console.time('timeTaken');
                        }
                        this._cacheGroups = {};
                        this._broadcastChanges();
                    };
                    Service.prototype._applyChanges = function _applyChanges() {
                        this.length = 0;
                        var collection = this._getCollection();
                        for (var key in collection) {
                            if (collection.hasOwnProperty(key)) {
                                this.push(collection[key]);
                            }
                        }
                        if (this._debug) {
                            $window.console.timeEnd('timeTaken');
                        }
                    };
                    Service.prototype._broadcastChanges = function _broadcastChanges(useTimeout) {
                        var broadcast = function broadcast() {
                            $rootScope.$broadcast('crossfilter/updated');
                        };
                        if (useTimeout) {
                            $timeout(broadcast, 1);
                            return;
                        }
                        broadcast();
                    };
                    Service.prototype._assertDimensionExists = function _assertDimensionExists(property) {
                        if (typeof this._dimensions[property] === 'undefined') {
                            _throwException("Unable to find dimension named '" + property + "'");
                        }
                    };
                    Service.prototype._assertValidDimensionName = function _assertValidDimensionName(name) {
                        if (name === this.PRIMARY_DIMENSION) {
                            _throwException("Cannot define dimension using special dimension: '" + this.PRIMARY_DIMENSION + "'")
                        }
                        for (var key in this._dimensions) {
                            if (key === name) {
                                _throwException("Cannot overwrite an existing dimension: '" + key + "'");
                            }
                        }
                    };
                    Service.prototype._getProperties = function _getProperties(model) {
                        var properties = [];
                        for (var property in model) {
                            if (model.hasOwnProperty(property)) {
                                properties.push(property);
                            }
                        }
                        return properties;
                    };
                    Service.prototype._isArray = function _isArray(item) {
                        if (typeof $window.Array.isArray === 'function') {
                            return $window.Array.isArray(item);
                        }
                        if (typeof _ !== 'undefined') {
                            return _.isArray(item);
                        }
                        return (typeof item === '[object Array]');
                    };
                    Service.prototype._resetAll = function _resetAll() {
                        this._crossfilter = {};
                        this._cacheGroups = {};
                        this._dimensions = {};
                    };
                    Service.prototype.toString = function toString() {
                        return '[object Array]';
                    };
                    return Service;
                }
            ]);
        })(window.angular, window.crossfilter, window.moment, window._);
