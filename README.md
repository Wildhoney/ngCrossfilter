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

 * Filter by **word**: `words.filterBy('word', word)`;
 * Unfilter by **word**: `words.unfilterBy('word')`;
 * Unfilter all: `words.unfilterAll()`;

 <h5><code>filterBy</code></h5>
 Third argument allows the specifying of a custom filtering function &ndash; see <a href="#custom-filtering">custom functions</a>.

 <h3>Strategies</h3>
 By default the filtering strategy is `persistent` which means that all filters are persistent until they are re-applied, or removed. If you'd like to change to the `transient` behaviour where the previous filter is cleared, you can pass `transient` into `ngCrossfilter`'s constructor as the third argument.

 <h3>Custom Filtering</h3>
 By specifying a custom function on the third argument of the `filterBy` method you can implement your own sorting logic.

 ```javascript
 $scope.fuzzyFilter = function fuzzyFilter(property) {

     var regExp = new $RegExp($scope.word);
     return !!property.match(regExp, 'i');

 }
 ```

 Which can then be utilised by passing it as the third argument in your view.

 ```html
 <button ng-click="words.filterBy('word', word, fuzzyFilter)">
 ```

Sorting
-------------

 * Sort by **word**: `words.sortBy('word')`;
 * Unsort by **word**: `words.unsortBy('word')`;

 <h5><code>sortBy</code></h5>
 Second argument allows you to choose whether the sorting is by ascending &ndash; by not applying a value, the ascending will be inverted each time the same property is sorted on.

 <h5><code>unsortBy</code></h5>
 Second argument prevents the reverting of the sort order to ascending.

Contributions
-------------

As with all of my projects, you're more than welcome to contribute. Please include a unit test for your additions, and if the Travis build passes then it will be merged into master.