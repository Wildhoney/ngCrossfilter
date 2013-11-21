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

```html
<li ng-repeat="book in books |
    crossfilter: { filter: 'name', value: '1984', sort: 'id', direction: 'asc' }">
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

<h4>Exact Match</h4>

```html
<li ng-repeat="book in books | crossfilter: { filter: 'name', value: '1984' }">
```

Property `name` on the collection has to be exactly **1984**.

<h4>Fuzzy Match</h4>

```html
<li ng-repeat="book in books | crossfilter: { filter: 'name', value: '~Brave' }">
```

Property `name` on the collection has to contain **Brave New World**.

<h4>Expression Match</h4>

```html
<li ng-repeat="book in books | crossfilter: { filter: 'name', value: '~/World/i' }">
```

Property `name` on the collection has to match regular expression.

<h4>Range Match</h4>

```html
<li ng-repeat="book in books | crossfilter: { filter: 'id', value: [1,6] }">
```

Property `id` on the collection has to be between `1` and `6`.

Contributions
-------------

As with all of my projects, you're more than welcome to contribute. Please include a unit test for your additions, and if the Travis build passes then it will be merged into master.