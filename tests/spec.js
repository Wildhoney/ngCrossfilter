describe('ngCrossfilter', function() {

    var $service, $rootScope;

    var $collection = [

        { city: 'London', country: 'UK', population: 8.3, climate: 4,
            added: '2014-01-01', twinCities: ['Beijing', 'Tokyo', 'Paris'] },

        { city: 'Moscow', country: 'RU', population: 11.5, climate: 1,
            added: '2014-05-23', twinCities: ['Ankara', 'Manila', 'Tallinn'] },

        { city: 'Singapore', country: 'SG', population: 5.3, climate: 8,
            added: '2014-02-12', twinCities: ['Batam', 'Johor Bahru'] },

        { city: 'Rio de Janeiro', country: 'BR', population: 6.3, climate: 9,
            added: '2013-12-16', twinCities: ['Maryland', 'Beijing'] },

        { city: 'Hong Kong', country: 'HK', population: 7.1, climate: 2,
            added: '2001-11-04', twinCities: [] },

        { city: 'Manchester', country: 'UK', population: 2.5, climate: 18,
            added: '2012-11-14', twinCities: ['Los Angeles', 'Wuhan'] }

    ];

    beforeEach(function() {

        module('ngCrossfilter');

        inject(function($injector, Crossfilter) {

            $service   = new Crossfilter($collection);
            $rootScope = $injector.get('$rootScope');
            spyOn($rootScope, '$broadcast');

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

        it('Should not affect other Crossfilters;', function() {

            inject(function(Crossfilter) {

                var firstCrossfilter = new Crossfilter($collection),
                    secondCrossfilter = new Crossfilter($collection),
                    thirdCrossfilter = new Crossfilter($collection);

                secondCrossfilter.filterBy('country', 'BR');
                expect(firstCrossfilter.collection().length).toEqual(6);
                expect(secondCrossfilter.collection().length).toEqual(1);
                expect(thirdCrossfilter.collection().length).toEqual(6);

            });

        });

        it('Should be able to use the special ID "$id"', function() {

            inject(function($rootScope, Crossfilter) {

                $rootScope.$apply(function() {

                    var crossfilter = new Crossfilter($collection, '$id');
                    expect(crossfilter._primaryKey).toEqual('$id');
                    expect(crossfilter.collection(Infinity)[0].$id).toBeDefined();

                    crossfilter.addModel({ city: 'Nottingham' });
                    crossfilter.filterBy('city', 'Nottingham');
                    expect(crossfilter.collection()[0].$id).toBeDefined();

                });

            });

        });

        it('Should be able to update a model using the special ID "$id"', function() {

            inject(function($rootScope, Crossfilter) {

                $rootScope.$apply(function() {

                    var crossfilter = new Crossfilter($collection, '$id');
                    expect(crossfilter._primaryKey).toEqual('$id');
                    expect(crossfilter.collection(Infinity)[0].$id).toBeDefined();

                    crossfilter.addModel({ city: 'Nottingham' });
                    crossfilter.filterBy('city', 'Nottingham');
                    var model = crossfilter.collection()[0];
                    expect(crossfilter.collection().length).toEqual(1);
                    crossfilter.updateModel(model, { city: 'Norwich' });
                    expect(crossfilter.collection().length).toEqual(0);
                    crossfilter.filterBy('city', 'Norwich');
                    expect(crossfilter.collection().length).toEqual(1);

                });

            });

        });

        it('Should be able to initialise with an empty collection;', function() {

            inject(function($rootScope, Crossfilter) {

                $rootScope.$apply(function() {

                    var crossfilter = new Crossfilter([], 'name');
                    crossfilter.addDimension('name');
                    expect(crossfilter._dimensions.name).toBeTruthy();

                    crossfilter.addModel({ name: 'Kipper' });
                    expect(crossfilter.collection().length).toEqual(1);

                    crossfilter.deleteModel({ name: 'Kipper' });
                    expect(crossfilter.collection().length).toEqual(0);

                    crossfilter.restoreModel({ name: 'Kipper' });
                    expect(crossfilter.collection().length).toEqual(1);

                });

            });

        });

        it('Should be able to define the primary key later;', function() {

            inject(function(Crossfilter) {

                var crossfilter = new Crossfilter([]);
                crossfilter.primaryKey('name');

                crossfilter.addDimension('name');
                expect(crossfilter._dimensions.name).toBeTruthy();

                crossfilter.addModel({ name: 'Kipper' });
                expect(crossfilter.collection().length).toEqual(1);

                crossfilter.deleteModel({ name: 'Kipper' });
                expect(crossfilter.collection().length).toEqual(0);

                crossfilter.restoreModel({ name: 'Kipper' });
                expect(crossfilter.collection().length).toEqual(1);

            });

        });

        it('Should be reporting itself as a valid array;', function() {
            expect(Array.isArray($service.collection())).toBeTruthy();
        });

        it('Should be able to validate the specified primary key;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter($collection, 'id');
                }).toThrow("ngCrossfilter: Primary key 'id' is not in the collection.");
            });
        });

        it('Should be able to detect when primary key is not one of the dimensions;', function() {
            inject(function(Crossfilter) {
                expect(function() {
                    $service = new Crossfilter($collection, 'id', 'transient', ['word']);
                }).toThrow("ngCrossfilter: Primary key 'id' as one of the dimensions.");
            });
        });

        it('Should be able to define the primary key when unset;', function() {

            inject(function(Crossfilter) {

                $service = new Crossfilter();
                expect($service._primaryKey).toEqual('');
                $service.addModel($collection[0]);
                expect($service._primaryKey).toEqual('city');

                $service.filterBy('city', 'Non-existent');
                expect($service.collection().length).toEqual(0);

                $service.unfilterBy('city');
                expect($service.collection().length).toEqual(1);

                $service.filterBy('city', 'London');
                expect($service.collection().length).toEqual(1);

                $service.deleteModel($collection[0]);
                expect($service.collection().length).toEqual(0);

            });

        });

        it('Should be able to get a slice of the collection;', function() {

            var slice;

            slice = $service.models(0, 2);
            expect(slice.length).toEqual(2);
            expect(slice[0].country).toEqual('HK');

            slice = $service.models(1, 4);
            expect(slice.length).toEqual(3);
            expect(slice[0].country).toEqual('UK');


        });

        it('Should not be registering methods/properties on the prototype chain;', function() {
            expect([]._crossfilter).toBeUndefined();
            expect([].filterBy).toBeUndefined();
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
            expect(typeof $service.crossfilter()).toEqual('object');
            expect($service.crossfilter().dimension).toBeDefined();
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

        it('Should be able to filter by the country name and broadcast changes;', function() {
            expect($service.collection().length).toEqual(6);
            $service.filterBy('country', 'UK');
            expect($service.collection().length).toEqual(2);
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
            expect($service.collection().length).toEqual(2);
            $service.filterBy('city', 'London');
            expect($service.collection().length).toEqual(1);
            $service.unfilterBy('city');
            expect($service.collection().length).toEqual(2);
            $service.unfilterBy('country');
            expect($service.collection().length).toEqual(6);
        });

        it('Should be able to remove all applied filters;', function() {
            $service.filterBy('country', 'UK');
            $service.filterBy('city', 'London');
            expect($service.collection().length).toEqual(1);
            $service.unfilterAll();
            expect($service.collection().length).toEqual(6);
        });

        it('Should be able to apply a range filter;', function() {
            $service.filterBy('population', [7, 12]);
            expect($service.collection().length).toEqual(3);
        });

        it('Should be able to apply a custom filter;', function() {
                $service.filterBy('country', 'UK', function(expected, actual) {
                return expected !== actual;
            });
            expect($service.collection().length).toEqual(4);
        });

        it('Should be able to apply filters in a transient fashion;', function() {

            $service.filterBy('city', 'London');
            $service.filterBy('country', 'UK');
            expect($service.collection().length).toEqual(1);

            inject(function(Crossfilter) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
            });

            $service.filterBy('city', 'London');
            $service.filterBy('country', 'UK');
            expect($service.collection().length).toEqual(2);
            $service.unfilterAll();
            expect($service.collection().length).toEqual(6);

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
            expect($service.collection()[0].country).toEqual('BR');
            $service.sortBy('country', false);
            expect($service.collection()[0].country).toEqual('UK');
            $service.sortBy('country', true);
            expect($service.first().country).toEqual('BR');
            $service.sortBy('country', true);
            expect($service.last().country).toEqual('UK');
        });

        it('Should be able to reverse the sort when sorting by same property;', function() {
            $service.sortBy('country');
            expect($service.collection()[0].country).toEqual('BR');
            $service.sortBy('country');
            expect($service.collection()[0].country).toEqual('UK');
            $service.sortBy('country');
            expect($service.collection()[0].country).toEqual('BR');
        });

        it('Should be able to unsort the collection;', function() {
            $service.sortBy('population', false);
            expect($service.collection()[0].country).toEqual('RU');
            $service.unsortAll();
            expect($service.collection()[0].country).toEqual('HK');
        });

        it('Should be able to unsort the collection while maintaining order;', function() {
            $service.sortBy('population', false);
            expect($service.collection()[0].country).toEqual('RU');
            $service.unsortAll(true);
            expect($service.collection()[0].country).toEqual('SG');
            $service.sortBy('population', false);
            $service.unsortAll();
            expect($service.collection()[0].country).toEqual('HK');
        });

        it('Should be able to add a custom dimension and filter on it;', function() {

            $service.addDimension('countryCity', function(model) {
                return model.country + ': ' + model.city;
            });
            $service.filterBy('countryCity', 'UK: London');
            expect($service.collection().length).toEqual(1);

            expect(function() {
                $service.addDimension($service.PRIMARY_DIMENSION);
            }).toThrow("ngCrossfilter: Cannot define dimension using special dimension: '__primaryKey'.");

            expect($service._dimensions.twinCities).toBeDefined();
            $service.deleteDimension('twinCities');
            expect($service._dimensions.twinCities).toBeUndefined();
            $service.addDimension('twinCities');
            expect($service._dimensions.twinCities).toBeDefined();

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
            expect($service.collection().length).toEqual(7);
            $service.filterBy('country', 'RU');
            expect($service.collection().length).toEqual(2);
        });

        it('Should be able to delete a model;', inject(function($rootScope) {

            $rootScope.$apply(function() {

                var firstModel =  { city: 'Hong Kong', country: 'HK', population: 7.1 },
                    secondModel = { city: 'Rio de Janeiro', country: 'BR', population: 6.3 };

                $service.deleteModel(firstModel);
                expect($service.collection().length).toEqual(5);

                $service.deleteModels([secondModel]);
                expect($service.collection().length).toEqual(4);

            });

        }));

        it('Should be able to restore a model;', function() {

            var firstModel =  { city: 'Hong Kong', country: 'HK', population: 7.1 },
                secondModel = { city: 'Rio de Janeiro', country: 'BR', population: 6.3 };

            $service.deleteModel(firstModel);
            expect($service.collection().length).toEqual(5);
            $service.restoreModel(firstModel);
            expect($service.collection().length).toEqual(6);

            $service.deleteModel(secondModel);
            expect($service.collection().length).toEqual(5);

            $service.deleteModel(firstModel);
            expect($service.collection().length).toEqual(4);
            $service.restoreModels([secondModel]);
            expect($service.collection().length).toEqual(5);

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
            expect($service.collection().length).toEqual(6);
            var collection = $service.groupBy('country');
            expect(collection[3].value).toEqual(1);
            expect(collection[4].value).toEqual(2);
        });

        it('Should be able to broadcast its collection and identifier upon updates;', function() {
            inject(function(Crossfilter) {
                $service = new Crossfilter($collection);
                expect($rootScope.$broadcast)
                    .toHaveBeenCalledWith('crossfilter/updated', $service.collection(), '');

                $service.identifyAs('myCrossfilter');
                $service.sortBy('country');
                expect($rootScope.$broadcast)
                    .toHaveBeenCalledWith('crossfilter/updated', $service.collection(), 'myCrossfilter');
            });
        });

        describe('Bundled Filters', function() {

            it('Should be able to use the fuzzy filter;', function() {

                expect($service.collection().length).toEqual(6);

                $service.filterBy('city', 'M', $service.filters.fuzzy());
                expect($service.collection().length).toEqual(2);
                $service.unfilterBy('city');

                expect($service.collection().length).toEqual(6);
                $service.filterBy('city', 'S', $service.filters.fuzzy());
                expect($service.collection().length).toEqual(1);
                $service.unfilterBy('city');

                expect($service.collection().length).toEqual(6);
                $service.filterBy('city', 'S', $service.filters.fuzzy('i'));
                expect($service.collection().length).toEqual(3);

            });

            it('Should be able to use the regexp filter;', function() {

                expect($service.collection().length).toEqual(6);

                $service.filterBy('city', /^m/i, $service.filters.regexp());
                expect($service.collection().length).toEqual(2);
                $service.unfilterBy('city');

                $service.filterBy('city', /o$/, $service.filters.regexp());
                expect($service.collection().length).toEqual(1);
                $service.unfilterBy('city');

                $service.filterBy('city', new RegExp('o$'), $service.filters.regexp());
                expect($service.collection().length).toEqual(1);

                expect(function() {
                    $service.filterBy('city', 'o$', $service.filters.regexp());
                }).toThrow("ngCrossfilter: Expression must be an instance of RegExp.");

            });

            it('Should be able to use the bitwise filter;', function() {

                expect($service.collection().length).toEqual(6);
                $service.filterBy('climate', 2, $service.filters.bitwise());
                expect($service.collection().length).toEqual(2);

                $service.unfilterBy('climate');

                expect($service.collection().length).toEqual(6);
                $service.filterBy('climate', 2, $service.filters.bitwise('!'));
                expect($service.collection().length).toEqual(4);

            });

            it('Should be able to use the dateTime range filter;', function() {

                expect($service.collection().length).toEqual(6);
                $service.filterBy('added', ['2014-01-01', '2014-07-01'], $service.filters.dateTimeRange('YYYY-MM-DD'));
                expect($service.collection().length).toEqual(3);

                $service.unfilterBy('added');

                expect($service.collection().length).toEqual(6);
                $service.filterBy('added', [-Infinity, '2012-07-01'], $service.filters.dateTimeRange('YYYY-MM-DD'));
                expect($service.collection().length).toEqual(1);

                $service.unfilterBy('added');

                expect($service.collection().length).toEqual(6);
                $service.filterBy('added', ['2013-01-01', Infinity], $service.filters.dateTimeRange('YYYY-MM-DD'));
                expect($service.collection().length).toEqual(4);

                $service.unfilterBy('added');

                expect($service.collection().length).toEqual(6);
                $service.filterBy('added', ['2012-01-01', '2012-12-01'], $service.filters.dateTimeRange('YYYY-MM-DD'));
                expect($service.collection().length).toEqual(1);

                $service.unfilterBy('added');
                expect($service.collection().length).toEqual(6);

                expect(function() {
                    $service.filterBy('added', ['2012-01-01', '2012-12-01'], $service.filters.dateTimeRange('blah'));
                }).toThrow("ngCrossfilter: Date/Time parsing appears to be using invalid format.");

            });

            it('Should be able to use the inArray filter;', function() {

                expect($service.collection().length).toEqual(6);

                $service.filterBy('twinCities', ['Los Angeles', 'Wuhan'], $service.filters.inArray());
                expect($service.collection().length).toEqual(1);
                $service.unfilterBy('twinCities');

                expect($service.collection().length).toEqual(6);

                $service.filterBy('twinCities', ['Beijing'], $service.filters.inArray());
                expect($service.collection().length).toEqual(2);
                $service.unfilterBy('twinCities');

                expect($service.collection().length).toEqual(6);

                $service.filterBy('twinCities', 'Beijing', $service.filters.inArray());
                expect($service.collection().length).toEqual(2);
                $service.unfilterBy('twinCities');

                expect($service.collection().length).toEqual(6);

                $service.filterBy('twinCities', ['Beijing', 'Los Angeles'], $service.filters.inArray('every'));
                expect($service.collection().length).toEqual(0);
                $service.unfilterBy('twinCities');

                expect($service.collection().length).toEqual(6);

                $service.filterBy('twinCities', ['Beijing', 'Los Angeles'], $service.filters.inArray('some'));
                expect($service.collection().length).toEqual(3);
                $service.unfilterBy('twinCities');

                expect(function() {
                    $service.filterBy('twinCities', 'Tokyo', $service.filters.inArray('pfft!'));
                }).toThrow("ngCrossfilter: You must pass either 'every' or 'some'.");

            });

            it('Should be able to use the notInArray filter;', function() {

                expect($service.collection().length).toEqual(6);

                $service.filterBy('twinCities', ['Los Angeles', 'Wuhan'], $service.filters.notInArray());
                expect($service.collection().length).toEqual(5);
                $service.unfilterBy('twinCities');

            });

        });

    });

});