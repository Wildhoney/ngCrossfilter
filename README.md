ngCrossfilter
=============

<img src="https://api.travis-ci.org/Wildhoney/ngCrossfilter.png" />
&nbsp;
<img src="https://badge.fury.io/js/ng-crossfilter.png" />

Introduction
-------------

Angular uses native JavaScript methods for sorting, whereas `ngCrossfilter` uses <a href="https://github.com/square/crossfilter" target="_blank">Crossfilter</a> for a significant improvement in performance. It introduces an intuitive microsyntax for filtering which is simple to get to grips with.

Getting Started
-------------

Filtering for `ngCrossfilter` is performed in your HTML template as you do with other Angular filters. As the filtering options for Crossfilter are somewhat more verbose than the standard Angular filtering, we recommend that you reference an `options` variable in your controller, and handle the options within there as opposed to within your template.

For example the following HTML:

```html
<li ng-repeat="book in books | crossfilter: options">
```

Would take its `options` value from the controller:

```javascript
$scope.options = {

    filter: {
        property:   'name',
        value:      null
    },

    sort: {
        property:   'id',
        value:      'asc'
    }

};
```


<h5>Properties</h5>

<table>
    <tr>
        <th>Property</th>
        <th>Behaviour</th>
    </tr>
    <tr>
        <td><code>filter</code></td>
        <td>Property to apply the filter to.</td>
    </tr>
    <tr>
        <td><code>value</code></td>
        <td>Value to use for the filter &ndash; see <a href="#filtering-microsyntax">microsyntax</a>.</td>
    </tr>
    <tr>
        <td><code>sort</code></td>
        <td>Property to use for the sorting.</td>
    </tr>
    <tr>
        <td><code>direction</code></td>
        <td>Direction of the sorting - <code>asc</code>/<code>desc</code></td>
    </tr>
</table>

As is typical with Angular, if you update any of the properties then the filtering and sorting will automatically change. Each property should ideally be set with a variable as opposed to an explicit string.

Filtering Microsyntax
-------------

Since Crossfilter allows you to filter data in different ways, `ngCrossfilter` introduces an easy-to-learn microsyntax to apply different types of filters using the `value` property.

Mostly the filtering strategy is based on the leading character of the filter string.

All filters can be cleared by passing `false` to the `value` property.

 * **Exact Match**: Don't prepend the value with anything;
 * **Negative Exact Match**: Prepend the value with `!`;
 * **Fuzzy Match**: Prepend the value with `?`;
 * **Negative Fuzzy Match**: Prepend the value with `^`;
 * **Expression Match**: Prepend the value with `~`;
 * **Range Match**: Set the value to an array range (`[1,5]`);

Strategies
-------------

The strategies in `ngCrossfilter` have the same name and behaviour as those in <a href="https://github.com/Wildhoney/Snapshot.js" target="_blank">Snapshot.js</a>.

 * `afresh`: Each filter resets the previous filtered collection;
 * `reduce`: Each filter filters down on the current filtered collection;

If you'd like to change the strategy from the default &ndash; `afresh`, then simply modify the `strategy` property to `reduce` &ndash; <a href="https://github.com/Wildhoney/ngCrossfilter/blob/master/example/js/app.js">see example</a>.

Contributions
-------------

As with all of my projects, you're more than welcome to contribute. Please include a unit test for your additions, and if the Travis build passes then it will be merged into master.