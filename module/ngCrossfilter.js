(function($angular, $crossfilter) {

    "use strict";

    /**
     * @module ngCrossfilter
     * @author Adam Timberlake
     */
    var ngCrossfilter = $angular.module('ngCrossfilter', []);

    /**
     * @service crossfilterFilter
     */
    ngCrossfilter.service('crossfilterFilter', function() {

        /**
         * @property _crossfilter
         * @type {Object}
         * @private
         */
        var _crossfilter = {};

        /**
         * @property _dimensions
         * @type {Object}
         * @private
         */
        var _dimensions = {};

        /**
         * @property _previousProperty
         * @type {String}
         * @private
         */
        var _previousProperty = '';

        /**
         * @property _defaultStrategy
         * @type {String}
         * @private
         */
        var _defaultStrategy = 'afresh';

        /**
         * @method _setupCrossfilter
         * @param collection {Array}
         * @return {void}
         * @private
         */
        var _setupCrossfilter = function _setupCrossfilter(collection) {

            var properties  = _getProperties(collection[0]);
            _crossfilter    = $crossfilter(collection);

            // Iterate over each property to create its related dimension.
            $angular.forEach(properties, function(property) {

                _dimensions[property] = _crossfilter.dimension(function(model) {
                    return model[property];
                });

            });

        };

        /**
         * @method _getProperties
         * @param model {Object}
         * @return {Array}
         * @private
         */
        var _getProperties = function _getProperties(model) {

            var properties = [];

            for (var property in model) {

                if (model.hasOwnProperty(property)) {
                    properties.push(property);
                }

            }

            return properties;

        };

        /**
         * @method _applyFilter
         * @param property {String}
         * @param value {String}
         * @param strategy {String}
         * @return {void}
         * @private
         */
        var _applyFilter = function _applyFilter(property, value, strategy) {

            if (strategy === 'afresh' && _previousProperty) {

                // Reset the previous filter if we're using the "afresh" strategy.
                _dimensions[_previousProperty].filterAll();

            }

            _previousProperty   = property;
            var dimension       = _dimensions[property];

            /**
             * @method strip
             * @param value {String}
             * @return {String}
             */
            var strip = function(value) {
                return value.substr(1);
            };

            // Determine if we have an array-like value, in which case we're using the range function.
            if ($angular.isArray(value)) {
                dimension.filterRange(value);
                return;
            }

            switch (String(value).charAt(0)) {
                // Otherwise we have a string and we need to know which function to apply.
                case ('?')  : _filterFuzzy(dimension, strip(value)); break;
                case ('~')  : _filterRegExp(dimension, strip(value)); break;
                default     : _filterExact(dimension, value); break;
            }

        };

        /**
         * Responsible for clearing all of the dimensions.
         * @method _clearDimensions
         * @return {void}
         * @private
         */
        var _clearDimensions = function _clearDimensions() {

            $angular.forEach(_dimensions, function(dimension) {
                dimension.filterAll();
            });

        };

        /**
         * @method _filterFuzzy
         * @param dimension {Object}
         * @param value {String}
         * @private
         */
        var _filterFuzzy = function(dimension, value) {

            var regExp = new RegExp(value, 'i');

            dimension.filterFunction(function(d) {
                return String(d).match(regExp);
            });

        };

        /**
         * @method _filterExact
         * @param dimension {Object}
         * @param value {String}
         * @private
         */
        var _filterExact = function(dimension, value) {

            var regExp = new RegExp(value, 'i');

            dimension.filterFunction(function(d) {
                return d.match(regExp);
            });

        };

        /**
         * @method _filterRegExp
         * @param dimension {Object}
         * @param value {String}
         * @private
         */
        var _filterRegExp = function(dimension, value) {

            // Find the flags for the regular expression.
            var flags   = value.match(/\/([a-z])*$/)[1];

            // Extract the value from the regular expression.
            value       = value.match(/^\/(.+?)\/[a-z]*$/i)[1];

            // Finally we can construct the RegExp object.
            var regExp  = new RegExp(value, flags);

            dimension.filterFunction(function(d) {
                return d.match(regExp);
            });

        };

        /**
         * @method ngCrossfilter
         * @params collection {Array}
         * @params options {Object}
         * @return {Array}
         */
        return function ngCrossfilter(collection, options) {

            var coll = $angular.copy(collection);

            if (options.filter.value === false) {
                _clearDimensions();
            }

            if (!('groupAll' in _crossfilter && 'dimension' in _crossfilter)) {
                // Setup the Crossfilter if we haven't already.
                _setupCrossfilter(coll);
            }

            if (options.filter && options.filter.value) {
                var strategy = options.strategy || _defaultStrategy;
                _applyFilter(options.filter.property, options.filter.value, strategy);
            }

            var dimension   = _dimensions[options.sort.property || 'id'],
                direction   = ((options.sort.value || 'asc') === 'asc') ? 'bottom' : 'top';

            return dimension[direction](Infinity);

        }

    });

})(window.angular, window.crossfilter);