describe('ngCrossfilter', function() {

    var $service, $filter;

    var $collection = [
        { city: 'London', country: 'UK', population: 8.3 },
        { city: 'Moscow', country: 'RU', population: 11.5 },
        { city: 'Singapore', country: 'SG', population: 5.3 },
        { city: 'Rio de Janeiro', country: 'BR', population: 6.3 },
        { city: 'Hong Kong', country: 'HK', population: 7.1 },
        { city: 'Manchester', country: 'UK', population: 2.5 }
    ];

    beforeEach(function() {

        module('ngCrossfilter');

        inject(function(Crossfilter, _$filter_) {
            $service = new Crossfilter($collection);
            $filter  = _$filter_;
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
            var collection = $filter('crossfilter')($service);
            expect($service._iterations.previous).toEqual(2);
            expect($service._iterations.current).toEqual(2);
            expect($service._cacheCollection.length).toEqual(1);
        });

    });

    describe('Service', function() {

        it('Should be able to assume the primary key;', function() {
            expect($service._primaryKey).toEqual('city');
        });

        it('Should be able to change the primary key', function() {

            inject(function(Crossfilter, _$filter_) {
                $service = new Crossfilter($collection, 'country');
                $filter  = _$filter_;
            });

            expect($service._primaryKey).toEqual('country');

        });

        it('Should be able to assume the default strategy;', function() {
            expect($service._strategy).toEqual($service.STRATEGY_PERSISTENT);
        });

        it('Should be able to change the strategy;', function() {

            inject(function(Crossfilter, _$filter_) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
                $filter  = _$filter_;
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
        });

        it('Should be able to remove all applied filters;', function() {
            $service.filterBy('country', 'UK');
            $service.filterBy('city', 'London');
            expect($service.getCollection().length).toEqual(1);
            $service.unfilterAll();
            expect($service.getCollection().length).toEqual(6);
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
        });

        it('Should be able to apply filters in a transient fashion;', function() {

            $service.filterBy('city', 'London');
            $service.filterBy('country', 'UK');
            expect($service.getCollection().length).toEqual(1);

            inject(function(Crossfilter, _$filter_) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
                $filter  = _$filter_;
            });

            $service.filterBy('city', 'London');
            $service.filterBy('country', 'UK');
            expect($service.getCollection().length).toEqual(2);
            $service.unfilterAll();
            expect($service.getCollection().length).toEqual(6);

        });

        it('Should be able to memorise the last applied filter;', function() {

            inject(function(Crossfilter, _$filter_) {
                $service = new Crossfilter($collection, null, $service.STRATEGY_TRANSIENT);
                $filter  = _$filter_;
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
            expect($service.getModel($service.getCollection().length - 1).country).toEqual('UK');
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

        it('Should be able to add a model and filter on it;', function() {
            $service.addModel({ city: 'St. Petersburg', country: 'RU', population: 4.8 });
            expect($service.getCollection().length).toEqual(7);
            $service.filterBy('country', 'RU');
            expect($service.getCollection().length).toEqual(2);
        });

    });

});