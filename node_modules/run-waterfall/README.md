# run-waterfall [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[travis-image]: https://img.shields.io/travis/feross/run-waterfall/master.svg
[travis-url]: https://travis-ci.org/feross/run-waterfall
[npm-image]: https://img.shields.io/npm/v/run-waterfall.svg
[npm-url]: https://npmjs.org/package/run-waterfall
[downloads-image]: https://img.shields.io/npm/dm/run-waterfall.svg
[downloads-url]: https://npmjs.org/package/run-waterfall
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

### Run an array of functions in series, **each passing its results to the next function**

![waterfall](https://raw.githubusercontent.com/feross/run-waterfall/master/img.png) [![Sauce Test Status](https://saucelabs.com/browser-matrix/run-waterfall.svg)](https://saucelabs.com/u/run-waterfall)

### install

```
npm install run-waterfall
```

### usage

#### waterfall(tasks, [callback])

Runs the `tasks` array of functions in series, **each passing their results to the next in
the array**. However, if any of the `tasks` pass an error to their own callback, the next
function is not executed, and the main `callback` is immediately called with the error.

##### arguments

- `tasks` - An array of functions to run, each function is passed a
`callback(err, result1, result2, ...)` it must call on completion. The first argument is
an error (which can be `null`) and any further arguments will be passed as arguments in
order to the next task.
- `callback(err, [results])` - An optional callback to run once all the functions have
completed. This will be passed the results of the last task's callback.

##### example

```js
var waterfall = require('run-waterfall')

waterfall([
  function (callback) {
    callback(null, 'one', 'two')
  },
  function (arg1, arg2, callback) {
    // arg1 now equals 'one' and arg2 now equals 'two'
    callback(null, 'three')
  },
  function (arg1, callback) {
    // arg1 now equals 'three'
    callback(null, 'done', 'wohoo')
  }
], function (err, result1, result2) {
   // result1 now equals 'done'
   // result2 now equals 'wohoo'
})
```

This module is basically equavalent to
[`async.waterfall`](https://github.com/caolan/async#waterfalltasks-callback), but it's
handy to just have the functions you need instead of the kitchen sink. Modularity!
Especially handy if you're serving to the browser and need to reduce your javascript
bundle size.

Works great in the browser with [browserify](http://browserify.org/)!

### see also

- [run-auto](https://github.com/feross/run-auto)
- [run-parallel](https://github.com/feross/run-parallel)
- [run-parallel-limit](https://github.com/feross/run-parallel-limit)
- [run-series](https://github.com/feross/run-series)

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).

Image credit: Waterfall designed by Luis Prado
