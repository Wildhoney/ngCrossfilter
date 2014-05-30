ngCrossfilter
=============

<img src="https://api.travis-ci.org/Wildhoney/ngCrossfilter.png" />
&nbsp;
<img src="https://badge.fury.io/js/ng-crossfilter.png" />

Heroku: [http://ng-crossfilter.herokuapp.com/](http://ng-crossfilter.herokuapp.com/)

Introduction
-------------

Angular uses native JavaScript methods for sorting, whereas `ngCrossfilter` uses <a href="https://github.com/square/crossfilter" target="_blank">Crossfilter</a> for a significant improvement in performance. It introduces an intuitive microsyntax for filtering which is simple to get to grips with.

Getting Started
-------------

Firstly you need to initialise Crossfilter with your collection of items.

```javascript
$scope.words = new Crossfilter(response.data, 'id', 'persistent');
```

`ngCrossfilter`'s constructor accepts three parameters &ndash; the last two being optional. With the second parameter you can change the primary key &ndash; which will otherwise default to the first property in the first model; whereas the third parameter allows you to change the <a href="#custom-filtering">filtering strategy</a> &ndash; either `persistent` or `transient`.

For timing information and other useful information for development, you can enable debug mode.

```javascript
$scope.words.debugMode(true);
```

Once you've configured your Crossfilter collection, you can begin filtering and sorting. From within your view you should reference your collection &ndash; in our case, `$scope.words`.

```html
<button ng-click="words.filterBy('word', word)">Filter</button>
```

After you've applied all of your filters, you need to add the `ngCrossfilter` filter to your `ng-repeat` directive.

```html
<li ng-repeat="model in words | crossfilter | limitTo: 100">
```

You should place the `crossfilter` filter before any other filters so that a standard array is piped to the subsequent filters.

Filtering
-------------

 Filter by **word**:

 ```javascript
 words.filterBy('word', word)
 ```

 *Third argument allows the specifying of a custom filtering function &ndash; see <a href="#custom-filtering">custom functions</a>.*

 Unfilter by **word**:

 ```javascript
 words.unfilterBy('word')
 ```

 Unfilter all:

 ```javascript
 words.unfilterAll()
 ```

 <h3>Strategies</h3>
 By default the filtering strategy is `persistent` which means that all filters are persistent until they are re-applied, or removed. If you'd like to change to the `transient` behaviour where the previous filter is cleared, you can pass `transient` into `ngCrossfilter`'s constructor as the third argument.

 <h3>Custom Filtering</h3>
 By specifying a custom function on the third argument of the `filterBy` method you can implement your own sorting logic.

 ```javascript
 $scope.fuzzyFilter = function fuzzyFilter(expected, actual) {

     var regExp = new $RegExp(expected);
     return !!actual.match(regExp, 'i');

 }
 ```

 Which can then be utilised by passing it as the third argument in your view.

 ```html
 <button ng-click="words.filterBy('word', word, fuzzyFilter)">
 ```

Sorting
-------------

 Sort by **word**:

 ```javascript
 words.sortBy('word')
 ```

 *Second argument allows you to choose whether the sorting is by ascending &ndash; by not applying a value, the ascending will be inverted each time the same property is sorted on.*

 Unsort by **word**:

 ```javascript
 words.unsortBy('word')
 ```

 *Second argument prevents the reverting of the sort order to ascending.*

Counting
-------------

With filters it's useful to compute the `length` of any given property and value pair &ndash; with `ngCrossfilter` we can do this with the `countBy` method.

```javascript
words.countBy('word', 'Adam')
```

However, there is one proviso and that is the `countBy` method may **not** behave as you expect it to as it disregards the dimension you're counting on &ndash; see [Crossfilter's Map-Reduce documentation](https://github.com/square/crossfilter/wiki/API-Reference#group-map-reduce).

In a nutshell, if you're filtering on the `name` property, and you're also counting by the `name` property, the `name` filter will be disregarded &ndash; instead you need to count on a dimension that you're not using in the filtering process &ndash; unless the default behaviour is useful *(and in most cases it actually makes sense)*. You can implement this by adding a custom dimension with `addDimension`, or by counting on the primary key &ndash; assuming it's not being used in the filtering process.

Other Methods
-------------

For the entire list of features for `ngCrossfilter` it is advised to refer to the unit tests &ndash; as these have full coverage of **all** `ngCrossfilter` methods and their usages.

 * `addDimension`: Add a custom dimension;
 * `deleteDimension`: Delete a dimension;
 * `getCollection`: Collection as a standard array;
 * `getModels`: Alias for `getCollection`;
 * `getFirst`: First model in the collection;
 * `getLast`: Last model in the collection;
 * `getModel`: *nth* model in the collection;
 * `countBy`: Count values &ndash; see <a href="#counting">Counting</a>;
 * `addModel`: Add a model to the collection;
 * `addModels`: Add models to the collection;
 * `deleteModel`: Delete a model from the collection;
 * `deleteModels`: Delete models from the collection;
 * `getCount`: Get a count of the collection;
 * `debugMode`: Enable/disable debugging mode;

Contributions
-------------

As with all of my projects, you're more than welcome to contribute. Please include a unit test for your additions, and if the Travis build passes then it will be merged into master.