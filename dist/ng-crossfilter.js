( function ngCrossfilterBootstrap( $angular, $crossfilter, $moment, _ ) {
    "use strict";
    var _throwException = function _throwException( message ) {
        throw "ngCrossfilter: " + message + ".";
    };
    if ( typeof $angular === 'undefined' ) {
        _throwException( "ngCrossfilter Requires Angular.js" );
    }
    if ( typeof $crossfilter === 'undefined' ) {
        _throwException( "ngCrossfilter Requires Crossfilter" );
    }
    var ngCrossfilter = $angular.module( 'ngCrossfilter', [] );
    ngCrossfilter.service( 'Crossfilter', [ '$rootScope', '$timeout', '$window',
        function CrossfilterService( $rootScope, $timeout, $window ) {
            var Service = function ngCrossfilterService( collection, primaryKey, strategy, properties ) {
                this.filters.HAS_UNDERSCORE = ( typeof _ !== 'undefined' );
                this.filters._isArray = this._isArray;
                this._resetAll();
                this._initialise( collection, primaryKey, strategy, properties );
                this._applyChanges();
                var masquerade = [];
                masquerade.length = collection.length;
                masquerade.__proto__ = this;
                return masquerade;
            };
            var SP = Service.prototype = [];
            SP.STRATEGY_PERSISTENT = 'persistent';
            SP.STRATEGY_TRANSIENT = 'transient';
            SP.PRIMARY_DIMENSION = '__primaryKey';
            SP._crossfilter = {};
            SP._cacheGroups = {};
            SP._isTiming = false;
            SP._dimensions = {};
            SP._primaryKey = '';
            SP._sortProperty = '';
            SP._isAscending = true;
            SP._lastFilter = '';
            SP._strategy = '';
            SP._debug = false;
            SP.filters = {
                HAS_UNDERSCORE: false,
                fuzzy: function fuzzyFilter( flags ) {
                    return function fuzzy( expected, actual ) {
                        var regExp = new $window.RegExp( expected, flags );
                        return !!actual.match( regExp );
                    };
                },
                dateTimeRange: function dateTimeRangeFilter( format, comparatorFunction ) {
                    if ( typeof $moment === 'undefined' ) {
                        _throwException( "You need to install Moment.js to use dateTimeRange" );
                    }
                    return function dateTimeRange( expected, actual ) {
                        var start = ( expected[ 0 ] === -Infinity ) ? 0 : $moment( expected[ 0 ], format ).unix(),
                            end = ( expected[ 1 ] === Infinity ) ? Infinity : $moment( expected[ 1 ], format ).unix(),
                            current = $moment( actual, format ).unix();
                        if ( start < 0 || end < 0 || current < 0 ) {
                            _throwException( "Date/Time parsing appears to be using invalid format" );
                        }
                        if ( typeof comparatorFunction === 'function' ) {
                            return comparatorFunction( current, start, end );
                        }
                        return ( current >= start && current <= end );
                    }
                },
                regexp: function regexpFilter() {
                    return function regexp( expected, actual ) {
                        if ( !( expected instanceof $window.RegExp ) ) {
                            _throwException( "Expression must be an instance of RegExp" );
                        }
                        return !!actual.match( expected );
                    }
                },
                bitwise: function bitwiseFilter( flag ) {
                    return function bitwise( expected, actual ) {
                        var result = ( expected & actual );
                        return ( flag === '!' ) ? !result : result;
                    }
                },
                inArray: function inArray( method ) {
                    return this._inArray( method );
                },
                notInArray: function notInArray( method ) {
                    return this._inArray( method, true );
                },
                _inArray: function inArrayFilter( method, invertInArray ) {
                    var hasUnderscore = this.HAS_UNDERSCORE,
                        isArray = this._isArray;
                    return function inArray( expected, actual ) {
                        if ( !isArray( actual ) ) {
                            _throwException( "Using inArray filter on a non-array like property" );
                        }
                        if ( !isArray( expected ) ) {
                            expected = [ expected ];
                        }
                        method = method || 'every';
                        if ( method && [ 'every', 'some' ].indexOf( method ) === -1 ) {
                            _throwException( "You must pass either 'every' or 'some'" );
                        }
                        if ( !hasUnderscore && ( typeof [].every !== 'function' || typeof [].some !== 'function' ) ) {
                            _throwException( "Browser does not support `every` and/or `some` methods" );
                        }
                        var everySome = function everySome( property ) {
                            var result = ( actual.indexOf( property ) !== -1 );
                            return ( invertInArray ) ? !result : result;
                        };
                        return hasUnderscore ? _[ method ]( expected, everySome ) : expected[ method ]( everySome );
                    }
                }
            };
            SP._initialise = function _initialise( collection, primaryKey, strategy, properties ) {
                if ( !this._isArray( collection ) ) {
                    _throwException( "Collection must be an array" );
                }
                strategy = strategy || this.STRATEGY_PERSISTENT;
                if ( [ this.STRATEGY_PERSISTENT, this.STRATEGY_TRANSIENT ].indexOf( strategy ) === -1 ) {
                    _throwException( "Strategy must be either '" + this.STRATEGY_PERSISTENT + "' or '" + this.STRATEGY_TRANSIENT + "'" );
                }
                if ( ( primaryKey ) && !( primaryKey in collection[ 0 ] ) ) {
                    _throwException( "Primary key '" + primaryKey + "' is not in the collection" );
                }
                properties = properties || this._getProperties( collection[ 0 ] );
                this._crossfilter = $crossfilter( collection );
                this._strategy = strategy;
                this._primaryKey = primaryKey || properties[ 0 ];
                var createDimension = function createDimension( name, property ) {
                    this._dimensions[ name ] = this._crossfilter.dimension( function ( model ) {
                        return model[ property || name ];
                    } );
                }.bind( this );
                $angular.forEach( properties, function ( property ) {
                    createDimension( property );
                }.bind( this ) );
                createDimension( this.PRIMARY_DIMENSION, this._primaryKey );
                this._broadcastChanges( true );
            };
            SP.filterBy = function filterBy( property, expected, customFilter ) {
                this._assertDimensionExists( property );
                if ( typeof customFilter !== 'undefined' && typeof customFilter !== 'function' ) {
                    throw _throwException( "Custom filter method must be a function" );
                }
                this._prepareChanges();
                if ( this._lastFilter && this._strategy === this.STRATEGY_TRANSIENT ) {
                    this.unfilterBy( this._lastFilter );
                }
                this._lastFilter = property;
                if ( typeof customFilter === 'function' ) {
                    this._dimensions[ property ].filterFunction( function customFilterFunction( actual ) {
                        return customFilter( expected, actual );
                    } );
                    this._applyChanges();
                    return;
                }
                this._dimensions[ property ].filter( expected );
                this._applyChanges();
            };
            SP.unfilterBy = function unfilterBy( property ) {
                this._assertDimensionExists( property );
                this._prepareChanges();
                this._dimensions[ property ].filterAll();
                this._applyChanges();
            };
            SP.unfilterAll = function unfilterAll() {
                this._prepareChanges();
                for ( var key in this._dimensions ) {
                    if ( this._dimensions.hasOwnProperty( key ) ) {
                        this._dimensions[ key ].filterAll();
                    }
                }
                this._applyChanges();
            };
            SP.sortBy = function sortBy( property, isAscending ) {
                this._assertDimensionExists( property );
                this._prepareChanges();
                if ( typeof isAscending === 'boolean' ) {
                    this._isAscending = isAscending;
                    this._sortProperty = property;
                    this._applyChanges();
                    return;
                }
                var currentSortProperty = this._sortProperty || this._primaryKey;
                if ( currentSortProperty === property ) {
                    this._isAscending = !this._isAscending;
                }
                this._sortProperty = property;
                this._applyChanges();
            };
            SP.unsortAll = function unsortAll( maintainSortOrder ) {
                this._prepareChanges();
                this._sortProperty = this._primaryKey;
                if ( maintainSortOrder !== true ) {
                    this._isAscending = true;
                }
                this._applyChanges();
            };
            SP.addDimension = function addDimension( name, setupFunction ) {
                setupFunction = setupFunction || function dimensionSetup( model ) {
                    return model[ name ];
                };
                this._assertValidDimensionName( name );
                this._dimensions[ name ] = this._crossfilter.dimension( setupFunction );
            };
            SP.deleteDimension = function deleteDimension( name ) {
                this._assertDimensionExists( name );
                this._dimensions[ name ].dispose();
                delete this._dimensions[ name ];
            };
            SP.first = function first() {
                return this[ 0 ];
            };
            SP.last = function last() {
                return this[ this.length - 1 ];
            };
            SP.countBy = function countBy( property, value ) {
                if ( this._cacheGroups[ property ] ) {
                    return this._cacheGroups[ property ][ value ] || 0;
                }
                this._timerManager();
                this._assertDimensionExists( property );
                var groups = {};
                var sums = this._dimensions[ property ].group().all();
                for ( var key in sums ) {
                    if ( sums.hasOwnProperty( key ) ) {
                        var model = sums[ key ];
                        groups[ model.key ] = model.value;
                    }
                }
                this._cacheGroups[ property ] = groups;
                this._timerManager();
                return groups[ value ] || 0;
            };
            SP.groupBy = function groupBy( property ) {
                this._assertDimensionExists( property );
                return this._dimensions[ property ].group( function group( property ) {
                    return property;
                } ).all();
            };
            SP.models = function models( offset, length ) {
                var slice = this._collection( typeof length === 'number' ? length : Infinity );
                return slice.splice( typeof offset === 'number' ? offset : Infinity );
            };
            SP.addModel = function addModel( model ) {
                return this.addModels( [ model ] );
            };
            SP.addModels = function addModels( models ) {
                this._crossfilter.add( models );
                this._applyChanges();
                return models.length;
            };
            SP.deleteModel = function deleteModel( model ) {
                return this.deleteModels( [ model ] );
            };
            SP.deleteModels = function deleteModel( models ) {
                var deleteKeys = [];
                $angular.forEach( models, function forEach( model ) {
                    var primaryKey = model[ this._primaryKey ];
                    if ( typeof primaryKey === 'undefined' ) {
                        _throwException( "Unable to find the primary key in model: '" + this._primaryKey + "'" );
                    }
                    deleteKeys.push( primaryKey );
                }.bind( this ) );
                this._dimensions[ this.PRIMARY_DIMENSION ].filter( function filter( property ) {
                    return ( deleteKeys.indexOf( property ) === -1 );
                } );
                this._applyChanges();
                return deleteKeys.length;
            };
            SP.debugMode = function debugMode( state ) {
                this._debug = !!state;
            };
            SP.crossfilter = function crossfilter() {
                return this._crossfilter;
            };
            SP._collection = function _collection( limit ) {
                var sortProperty = this._sortProperty || this._primaryKey,
                    sortOrder = this._isAscending ? 'bottom' : 'top';
                if ( typeof this._dimensions[ sortProperty ] === 'undefined' ) {
                    return this;
                }
                return this._dimensions[ sortProperty ][ sortOrder ]( limit || Infinity );
            };
            SP._prepareChanges = function _prepareChanges() {
                this._timerManager();
                this._cacheGroups = {};
                this._broadcastChanges();
            };
            SP._applyChanges = function _applyChanges() {
                this.length = 0;
                var collection = this._collection( Infinity );
                for ( var key in collection ) {
                    if ( collection.hasOwnProperty( key ) ) {
                        this.push( collection[ key ] );
                    }
                }
                this._timerManager();
            };
            SP._broadcastChanges = function _broadcastChanges( useTimeout ) {
                var broadcast = function broadcast() {
                    $rootScope.$broadcast( 'crossfilter/updated' );
                };
                if ( useTimeout ) {
                    $timeout( broadcast, 1 );
                    return;
                }
                broadcast();
            };
            SP._assertDimensionExists = function _assertDimensionExists( property ) {
                if ( typeof this._dimensions[ property ] === 'undefined' ) {
                    _throwException( "Unable to find dimension named '" + property + "'" );
                }
            };
            SP._assertValidDimensionName = function _assertValidDimensionName( name ) {
                if ( name === this.PRIMARY_DIMENSION ) {
                    _throwException( "Cannot define dimension using special dimension: '" + this.PRIMARY_DIMENSION + "'" )
                }
                for ( var key in this._dimensions ) {
                    if ( key === name ) {
                        _throwException( "Cannot overwrite an existing dimension: '" + key + "'" );
                    }
                }
            };
            SP._timerManager = function _timerManager() {
                if ( !this._debug ) {
                    return;
                }
                var method = this._isTiming ? 'time' : 'timeEnd';
                this._isTiming = !this._isTiming;
                $window.console[ method ]( 'timeTaken' );
            };
            SP._getProperties = function _getProperties( model ) {
                var properties = [];
                for ( var property in model ) {
                    if ( model.hasOwnProperty( property ) ) {
                        properties.push( property );
                    }
                }
                return properties;
            };
            SP._isArray = function _isArray( item ) {
                if ( typeof $window.Array.isArray === 'function' ) {
                    return $window.Array.isArray( item );
                }
                if ( typeof _ !== 'undefined' ) {
                    return _.isArray( item );
                }
                return ( typeof item === '[object Array]' );
            };
            SP._resetAll = function _resetAll() {
                this._crossfilter = {};
                this._cacheGroups = {};
                this._dimensions = {};
            };
            SP.toString = function toString() {
                return '[object Array]';
            };
            return Service;
        }
    ] );
} )( window.angular, window.crossfilter, window.moment, window._ );
