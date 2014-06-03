describe('ngCrossfilter', function() {

    var $service, $filter, $rootScope;

    var $collection = [
        { city: 'London', country: 'UK', population: 8.3, twinCities: ['Beijing', 'Tokyo', 'Paris'] },
        { city: 'Moscow', country: 'RU', population: 11.5, twinCities: ['Ankara', 'Manila', 'Tallinn'] },
        { city: 'Singapore', country: 'SG', population: 5.3, twinCities: ['Batam', 'Johor Bahru'] },
        { city: 'Rio de Janeiro', country: 'BR', population: 6.3, twinCities: ['Maryland', 'Beijing'] },
        { city: 'Hong Kong', country: 'HK', population: 7.1, twinCities: [] },
        { city: 'Manchester', country: 'UK', population: 2.5, twinCities: ['Los Angeles', 'Wuhan'] }
    ];

    beforeEach(function() {

        module('ngCrossfilter');

        inject(function($injector, Crossfilter, _$filter_) {

            $service = new Crossfilter($collection);
            $filter  = _$filter_;

            $rootScope = $injector.get('$rootScope');
            spyOn($rootScope, '$broadcast');

        });

    });

    describe('Filter', function() {

        it('Should be able to return standard array if one is passed;', function() {
            var collection = $filter('crossfilter')($collection);
            expect(collection.length).toEqual(6);
        });

        it('Should be able to return standard array if Crossfilter passed;', function() {
            var collection = $filter('crossfilter')($service);
            expect(collection.length).toEqual(6);
        });

        it('Should be able to increment iteration and use cache;', function() {
            expect($service._iterations.previous).toEqual(1);
            expect($service._iterations.current).toEqual(1);
            expect($service._cacheCollection.length).toEqual(0);
            $service.filterBy('country', 'SG');
            $filter('crossfilter')($service);
            expect($service._iterations.previous).toEqual(2);
            expect($service._iterations.current).toEqual(2);
            expect($service._cacheCollection.length).toEqual(1);
        });

    });

    describe('Service', function() {

        it('Should be able to assume the primary key;', function() {
            expect($service._primaryKey).toEqual('city');
        });

        it('Should be able to change the primary key;', function() {

            inject(function(Crossfilter) {
                $service = new Crossfilter($collection, 'country');
            });

            expect($service._primaryKey).toEqual('country');

        });

        it('Should be able to validate the specified primary key;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter($collection, 'id');
                }).toThrow("ngCrossfilter: Primary key 'id' is not in the collection.");
            });
        });

        it('Should be able to supply a list of properties for the dimensions;', function() {

            inject(function(Crossfilter) {
                $service = new Crossfilter($collection, 'country', $service.STRATEGY_TRANSIENT, ['city', 'country']);
            });

            expect($service._dimensions.city).toBeDefined();
            expect($service._dimensions.country).toBeDefined();
            expect($service._dimensions.population).toBeUndefined();

        });

        it('Should be able to assume the default strategy;', function() {
            expect($service._strategy).toEqual($service.STRATEGY_PERSISTENT);
        });

        it('Should be able to change the strategy;', function() {

            inject(function(Crossfilter) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
            });

            expect($service._strategy).toEqual($service.STRATEGY_TRANSIENT);
            expect($service._primaryKey).toEqual('city');

        });

        it('Should be able to configure all of the dimensions;', function() {
            expect($service._dimensions.city).toBeDefined();
            expect($service._dimensions.country).toBeDefined();
            expect($service._dimensions.population).toBeDefined();
        });

        it('Should be able to initialise the collection;', function() {
            expect(typeof $service._collection).toEqual('object');
            expect($service._collection.dimension).toBeDefined();
        });

        it('Should be able to determine when the collection is not an array;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter('not an array');
                }).toThrow("ngCrossfilter: Collection must be an array.");
            });
        });

        it('Should be able to detect an invalid filtering strategy;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter($collection, 'city', 'invalid strategy');
                }).toThrow("ngCrossfilter: Strategy must be either 'persistent' or 'transient'.");
            });
        });

        it('Should be able to enable the debug mode;', function() {
            expect($service._debug).toBeFalsy();
            $service.debugMode(true);
            expect($service._debug).toEqual(true);
            $service.debugMode('yes');
            expect($service._debug).toEqual(true);
            $service.debugMode(0);
            expect($service._debug).toEqual(false);
        });

        it('Should be able to filter by the country name;', function() {
            expect($service.getCollection().length).toEqual(6);
            $service.filterBy('country', 'UK');
            expect($service.getCollection().length).toEqual(2);
            expect($rootScope.$broadcast).toHaveBeenCalledWith('crossfilter/updated');
        });

        it('Should be able to detect when a non-function is passed;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter($collection);
                    $service.filterBy('city', 'Hong Kong', 'non-function');
                }).toThrow("ngCrossfilter: Custom filter method must be a function.");
            });
        });

        it('Should be able to remove the applied filter;', function() {
            $service.filterBy('country', 'UK');
            expect($service.getCollection().length).toEqual(2);
            $service.filterBy('city', 'London');
            expect($service.getCollection().length).toEqual(1);
            $service.unfilterBy('city');
            expect($service.getCollection().length).toEqual(2);
            $service.unfilterBy('country');
            expect($service.getCollection().length).toEqual(6);
            expect($rootScope.$broadcast).toHaveBeenCalledWith('crossfilter/updated');
        });

        it('Should be able to remove all applied filters;', function() {
            $service.filterBy('country', 'UK');
            $service.filterBy('city', 'London');
            expect($service.getCollection().length).toEqual(1);
            $service.unfilterAll();
            expect($service.getCollection().length).toEqual(6);
            expect($rootScope.$broadcast).toHaveBeenCalledWith('crossfilter/updated');
        });

        it('Should be able to apply a range filter;', function() {
            $service.filterBy('population', [7, 12]);
            expect($service.getCollection().length).toEqual(3);
        });

        it('Should be able to apply a custom filter;', function() {
            $service.filterBy('country', 'UK', function(expected, actual) {
                return expected !== actual;
            });
            expect($service.getCollection().length).toEqual(4);
            expect($rootScope.$broadcast).toHaveBeenCalledWith('crossfilter/updated');
        });

        it('Should be able to apply filters in a transient fashion;', function() {

            $service.filterBy('city', 'London');
            $service.filterBy('country', 'UK');
            expect($service.getCollection().length).toEqual(1);

            inject(function(Crossfilter) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
            });

            $service.filterBy('city', 'London');
            $service.filterBy('country', 'UK');
            expect($service.getCollection().length).toEqual(2);
            $service.unfilterAll();
            expect($service.getCollection().length).toEqual(6);

        });

        it('Should be able to memorise the last applied filter;', function() {

            inject(function(Crossfilter) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
            });

            $service.filterBy('population', [7, 12]);
            expect($service._lastFilter).toEqual('population');

        });

        it('Should be able to sort the collection;', function() {
            $service.sortBy('country');
            expect($service.getModel(0).country).toEqual('BR');
            $service.sortBy('country', false);
            expect($service.getModel(0).country).toEqual('UK');
            $service.sortBy('country', true);
            expect($service.getModel(0).country).toEqual('BR');
            $service.sortBy('country', true);
            expect($service.getLast().country).toEqual('UK');
        });

        it('Should be able to reverse the sort when sorting by same property;', function() {
            $service.sortBy('country');
            expect($service.getModel(0).country).toEqual('BR');
            $service.sortBy('country');
            expect($service.getModel(0).country).toEqual('UK');
            $service.sortBy('country');
            expect($service.getModel(0).country).toEqual('BR');
        });

        it('Should be able to unsort the collection;', function() {
            $service.sortBy('population', false);
            expect($service.getModel(0).country).toEqual('RU');
            $service.unsortBy('population');
            expect($service.getModel(0).country).toEqual('HK');
        });

        it('Should be able to unsort the collection and maintaining order;', function() {
            $service.sortBy('population', false);
            expect($service.getModel(0).country).toEqual('RU');
            $service.unsortBy('population', true);
            expect($service.getModel(0).country).toEqual('SG');
            $service.sortBy('population', false);
            $service.unsortBy('population');
            expect($service.getModel(0).country).toEqual('HK');
        });

        it('Should be able to add a custom dimension and filter on it;', function() {
            $service.addDimension('countryCity', function(model) {
                return model.country + ': ' + model.city;
            });
            $service.filterBy('countryCity', 'UK: London');
            expect($service.getCollection().length).toEqual(1);
        });

        it('Should be able to delete a dimension;', function() {
            expect($service._dimensions.city).toBeDefined();
            $service.deleteDimension('city');
            expect($service._dimensions.city).toBeUndefined();
            expect(function() {
                $service.filterBy('city', 'Moscow');
            }).toThrow("ngCrossfilter: Unable to find dimension named 'city'.");
        });

        it('Should be able to add a model and filter on it;', function() {
            var number = $service.addModel({ city: 'St. Petersburg', country: 'RU', population: 4.8 });
            expect(number).toEqual(1);
            expect($service.getCollection().length).toEqual(7);
            $service.filterBy('country', 'RU');
            expect($service.getModels().length).toEqual(2);
        });

        it('Should be able to remove a model;', function() {
            var model = { city: 'Hong Kong', country: 'HK', population: 7.1 };
            $service.deleteModel(model);
            expect($service.getCount()).toEqual(5);
        });

        it('Should be able to validate the primary key when deleting a model;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter($collection);
                    var model = { country: 'HK', population: 7.1 };
                    $service.deleteModel(model);
                }).toThrow("ngCrossfilter: Unable to find the primary key in model: 'city'.");
            });
        });

        it('Should be able to count on any given property;', function() {
            expect($service.countBy('country', 'UK')).toEqual(2);
            $service.filterBy('country', 'HK');
            expect($service.countBy('country', 'UK')).toEqual(2);
            $service.filterBy('country', 'HK');
            expect($service.countBy('country', 'UK')).toEqual(2);
            expect($service.countBy('city', 'Hong Kong')).toEqual(1);
            expect($service.countBy('city', 'Moscow')).toEqual(0);
        });

        it('Should be able to group by on any given property;', function() {
            expect($service.getCount()).toEqual(6);
            var collection = $service.groupBy('country');
            expect(collection[3].value).toEqual(1);
            expect(collection[4].value).toEqual(2);
        });

        it('Should be able to use the fuzzy filter;', function() {

            expect($service.getCount()).toEqual(6);

            $service.filterBy('city', 'M', $service.filters.fuzzy());
            expect($service.getCount()).toEqual(2);
            $service.unfilterBy('city');

            expect($service.getCount()).toEqual(6);
            $service.filterBy('city', 'S', $service.filters.fuzzy());
            expect($service.getCount()).toEqual(1);
            $service.unfilterBy('city');

            expect($service.getCount()).toEqual(6);
            $service.filterBy('city', 'S', $service.filters.fuzzy('i'));
            expect($service.getCount()).toEqual(3);

        });

        it('Should be able to use the regexp filter;', function() {

            expect($service.getCount()).toEqual(6);

            $service.filterBy('city', /^m/i, $service.filters.regexp());
            expect($service.getCount()).toEqual(2);
            $service.unfilterBy('city');

            $service.filterBy('city', /o$/, $service.filters.regexp());
            expect($service.getCount()).toEqual(1);
            $service.unfilterBy('city');

            $service.filterBy('city', new RegExp('o$'), $service.filters.regexp());
            expect($service.getCount()).toEqual(1);

            expect(function() {
                $service.filterBy('city', 'o$', $service.filters.regexp());
            }).toThrow("ngCrossfilter: Expression must be an instance of RegExp.");

        });

        it('Should be able to use the inArray filter;', function() {

            expect($service.getCount()).toEqual(6);

            $service.filterBy('twinCities', ['Los Angeles', 'Wuhan'], $service.filters.inArray());
            expect($service.getCount()).toEqual(1);
            $service.unfilterBy('twinCities');

            expect($service.getCount()).toEqual(6);

            $service.filterBy('twinCities', ['Beijing'], $service.filters.inArray());
            expect($service.getCount()).toEqual(2);
            $service.unfilterBy('twinCities');

            expect($service.getCount()).toEqual(6);

            $service.filterBy('twinCities', 'Beijing', $service.filters.inArray());
            expect($service.getCount()).toEqual(2);
            $service.unfilterBy('twinCities');

            expect($service.getCount()).toEqual(6);

            $service.filterBy('twinCities', ['Beijing', 'Los Angeles'], $service.filters.inArray('every'));
            expect($service.getCount()).toEqual(0);
            $service.unfilterBy('twinCities');

            expect($service.getCount()).toEqual(6);

            $service.filterBy('twinCities', ['Beijing', 'Los Angeles'], $service.filters.inArray('some'));
            expect($service.getCount()).toEqual(3);
            $service.unfilterBy('twinCities');

            expect(function() {
                $service.filterBy('city', 'Tokyo', $service.filters.inArray());
            }).toThrow("ngCrossfilter: Using inArray filter on a non-array like property.");

            expect(function() {
                $service.filterBy('twinCities', 'Tokyo', $service.filters.inArray('pfft!'));
            }).toThrow("ngCrossfilter: You must pass either 'every' or 'some'.");

        });

    });

});