ngCrossfilter
=============

<img src="https://api.travis-ci.org/Wildhoney/ngCrossfilter.png" />
&nbsp;
<img src="https://badge.fury.io/js/ng-crossfilter.png" />

Heroku: [http://ng-crossfilter.herokuapp.com/](http://ng-crossfilter.herokuapp.com/)

Introduction
-------------

Angular uses native JavaScript methods for sorting, whereas `ngCrossfilter` uses <a href="https://github.com/square/crossfilter" target="_blank">Crossfilter</a> for a significant improvement in performance.

Getting Started
-------------

Firstly you need to initialise Crossfilter with your collection of items.

```javascript
$scope.$ngc = new Crossfilter(response.data, 'id', 'persistent', ['name', 'age']);
```

`ngCrossfilter`'s constructor accepts four parameters &ndash; with only the first being mandatory. With the second parameter you can change the primary key &ndash; which will otherwise default to the first property in the first model; the third parameter allows you to change the <a href="#custom-filtering">filtering strategy</a> &ndash; either `persistent` or `transient`, whereas the fourth parameter allows you to specify which properties to create dimensions with.

Once you've configured your Crossfilter collection, you can begin filtering and sorting. From within your view you should reference your collection &ndash; in our case, `$ngc`.

```html
<button ng-click="$ngc.filterBy('word', word)">Filter</button>
```

After you've applied all of your filters, you simply need to iterate over the array using the `ng-repeat` directive.

```html
<li ng-repeat="model in $ngc.collection() | limitTo: 100">
```

Filtering
-------------

 Filter by **word**:

 ```javascript
 $ngc.filterBy('word', word)
 ```

 *Third argument allows the specifying of a custom filtering function &ndash; see <a href="#custom-filtering">custom functions</a>.*

 Unfilter by **word**:

 ```javascript
 $ngc.unfilterBy('word')
 ```

 Unfilter all:

 ```javascript
 $ngc.unfilterAll()
 ```

 <h3>Strategies</h3>
 By default the filtering strategy is `persistent` which means that all filters are persistent until they are re-applied, or removed. If you'd like to change to the `transient` behaviour where the previous filter is cleared, you can pass `transient` into `ngCrossfilter`'s constructor as the third argument.

 <h3>Custom Filtering</h3>
 By specifying a custom function on the third argument of the `filterBy` method you can implement your own sorting logic.

 ```javascript
 $scope.fuzzyFilter = function fuzzyFilter(expected, actual) {
     var regExp = new RegExp(expected);
     return actual.match(regExp, 'i');
 }
 ```

 Which can then be utilised by passing it as the third argument in your view.

 ```html
 <button ng-click="$ngc.filterBy('word', word, fuzzyFilter)">
 ```

Sorting
-------------

 Sort by **word**:

 ```javascript
 $ngc.sortBy('word')
 ```

 *Second argument allows you to choose whether the sorting is by ascending &ndash; by not applying a value, the ascending will be inverted each time the same property is sorted on.*

 Unsort all:

 ```javascript
 $ngc.unsortAll()
 ```

 *First argument prevents the reverting of the sort order to ascending.*

Counting
-------------

With filters it's useful to compute the `length` of any given property and value pair &ndash; with `ngCrossfilter` we can do this with the `countBy` method.

```javascript
$ngc.countBy('word', 'Adam')
```

However, there is one proviso and that is the `countBy` method may **not** behave as you expect it to as it disregards the dimension you're counting on &ndash; see [Crossfilter's Map-Reduce documentation](https://github.com/square/crossfilter/wiki/API-Reference#group-map-reduce).

In a nutshell, if you're filtering on the `name` property, and you're also counting by the `name` property, the `name` filter will be disregarded &ndash; instead you need to count on a dimension that you're not using in the filtering process &ndash; unless the default behaviour is useful &ndash; and in most cases it actually makes sense &ndash; see the **Word Count** filter in the example. You can implement this by adding a custom dimension with `addDimension`, or by counting on the primary key &ndash; assuming it's not being used in the filtering process.

Update Subscription
-------------

Sometimes it is preferable to subscribe to the update of the Crossfilter, and to apply any modifications of your data at that point rather than relying on Angular's dirty-checking.

In these cases you can listen to the `crossfilter/updated` event, which passes along the collection and the identifier of the Crossfilter.

```javascript
$scope.$on('crossfilter/updated', function(event, collection, identifier) {

    // Voila!

});
```

The identifier is empty by default, but can be set at any point.

```javascript
$ngc.identifyAs('myCrossfilter');
```

It is possible to disable and re-enable the broadcasting of the `crossfilter/updated` event. For example, the following would broadcast a single event.

```javascript
$ngc.disableBroadcastEvent();
$ngc.sortBy('population');
$ngc.unfilterBy('city');

$ngc.enableBroadcastEvent();
$ngc.filterBy('climate', [5, 10]);
```

If you need full control over when the event is triggered, you may disable the event as described above and broadcast it yourself.

```javascript
$ngc.broadcastEvent(true);
```

Bundled Filters
-------------

As there are common filtering techniques that Crossfilter doesn't implement, `ngCrossfilter` comes with a fine selection of bundled filters for common tasks.

 **Fuzzy Filter**

 With the [fuzzy filter](http://en.wikipedia.org/wiki/Fuzzy_logic) you can filter with incomplete expressions.

 ```javascript
 $ngc.filterBy('city', 'M', $ngc.filters.fuzzy());
 ```

 You will notice that the `fuzzy` method is invoking the method immediately &ndash; this allows you to pass valid regular expression flags for insensitivity, et cetera...

 ```javascript
 $ngc.filterBy('city', 'M', $ngc.filters.fuzzy('i'));
 ```

 By default no flags will be defined for the regular expression matching.

 **Regular Expression Filter**

 With the regular expression filtering you can specify an expression to filter on.

 ```javascript
 $ngc.filterBy('city', /o$/, $ngc.filters.regexp());
 ```

 You can pass either an expression or an actual `RegExp` object to the filter.

 **InArray Filter**

 With the `inArray` filter you can check an array against an array &ndash; using the `some` and `every` array methods &ndash; please check the [browser support](http://kangax.github.io/compat-table/es5/) before using it &ndash; although `ngCrossfilter` will fallback to [Underscore.js](http://underscorejs.org/) if it's installed.

 ```javascript
 $ngc.filterBy('twinCities', ['Beijing', 'Tokyo'], $ngc.filters.inArray());
 ```

 By default the `inArray` filter uses the `every` method, which means in the above example only entries where `twinCities` has both **Beijing** and **Tokyo** will be returned &ndash; you can use `some` instead by passing it into `inArray` filter method.

 ```javascript
 $ngc.filterBy('twinCities', ['Beijing', 'Tokyo'], $ngc.filters.inArray('some'));
 ```

 To invert the `inArray` filter, use the `notInArray` filter with the same parameters.

 **DateTime Filter**

 Allows you to select a date/time range irrespective of the format of the time and/or date &ndash; [Moment.js](http://momentjs.com/) is a requirement to use this filter.

 ```javascript
 $ngc.filterBy('added', ['2012-01-01', '2012-12-01'],
                        $ngc.filters.dateTimeRange('YYYY-MM-DD'));
 ```

 The first parameter of the `dateTimeRange` filter allows you to specify the exact format &ndash; [see Moment.js documentation](http://momentjs.com/docs/#/parsing/string-format/) &ndash; the default being **YYYY-MM-DD**. With the second parameter you can pass a comparator function for custom range filtering.

 ```javascript
 $ngc.filterBy('added', ['2012-01-01', '2012-12-01'],
                        $ngc.filters.dateTimeRange('YYYY-MM-DD'),
                        function(current, start, end) {
                            return (current > start);
                        });
 ```

 `dateTimeRange` also accepts `-Infinity`/`Infinity` ranges for where lows and highs are not applicable.

 ```javascript
 $ngc.filterBy('added', [-Infinity, '2012-12-01'],
                        $ngc.filters.dateTimeRange('YYYY-MM-DD'));
 ```

 **Bitwise Filter**

 Simple filter using the bitwise `&` operator against the collection.

 ```javascript
 $ngc.filterBy('climate', 2, $ngc.filters.bitwise());
 ```

 You can invert the filtering by passing an exclamation mark as the first argument to the `bitwise` method.

 ```javascript
 $ngc.filterBy('climate', 2, $ngc.filters.bitwise('!'));
 ```

Update Model
-------------

With Crossfilter updating a model requires removing it from the collection and then re-adding it. If you use this with one of your own primary keys then the PK will be added to the delete list, and therefore re-adding a model with the **same** PK will still be deleted. Therefore to make Crossfilter work with new models, you need to update the PK first &ndash; you can do this yourself, or you can use the convenient `updateModel` that `ngCrossfilter` provides &ndash; but you will be delegating the PK to `ngCrossfilter`.

In order to use `updateModel` you **must** define your primary key as `$id`.

```javascript
var $ngc = new Crossfilter(collection, '$id');
// ...
$ngc.updateModel(personModel, { name: 'Adam' });
```

With the `$id` PK in place, the `updateModel` will do all of the manual labour for you! You needn't worry about updating the PK yourself.

Other Methods
-------------

For the entire list of features for `ngCrossfilter` it is advised to refer to the unit tests &ndash; as these have full coverage of **all** `ngCrossfilter` methods and their usages.

**Accessors**
<ul>
 <li><code>first</code>: First model in the collection;</li>
 <li><code>last</code>: Last model in the collection;</li>
 <li><code>models</code>: Retrieve a slice of the collection;</li>
 <li><code>crossfilter</code>: Retrieve an instance of <code>crossfilter</code>;</li>
</ul>

**Dimensions**
<ul>
 <li><code>addDimension</code>: Add a custom dimension;</li>
 <li><code>deleteDimension</code>: Delete a dimension;</li>
</ul>

**Convenience**
<ul>
 <li><code>countBy</code>: Count values &ndash; see <a href="#counting">counting</a>;</li>
 <li><code>groupBy</code>: Group by any given dimension;</li>
</ul>

**Manipulation**
<ul>
 <li><code>addModel</code>: Add a model to the collection;</li>
 <li><code>addModels</code>: Add models to the collection;</li>
 <li><code>deleteModel</code>: Delete a model from the collection;</li>
 <li><code>deleteModels</code>: Delete models from the collection;</li>
 <li><code>restoreModel</code>: Restore a model from the garbage;</li>
 <li><code>restoreModels</code>: Restore models from the garbage;</li>
 <li><code>updateModel</code>: Update a model &ndash; see [update model](#update-model);</li>
</ul>

Contributions
-------------

As with all of my projects, you're more than welcome to contribute. Please include a unit test for your additions, and if the Travis build passes then it will be merged into master.