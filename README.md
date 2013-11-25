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

Filtering for `ngCrossfilter` is performed in your HTML template as you do with other Angular filters.

In the following HTML, the first item in the object is for the filtering, whereas the second item is for the sorting. This is **always** the case in `ngCrossfilter` &ndash; the `strategy` would appear at the end of the object as a simple string &ndash; **reduce** or **afresh**.

```html
<li ng-repeat="book in books | crossfilter: 'name': value : 'id': 'asc'">
```

From the above you can see that we're using the `name` property to filter on with its corresponding `value`, and for the sorting we're using the `id property with the **asc** value.

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