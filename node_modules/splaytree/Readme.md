# Splay tree [![npm version](https://badge.fury.io/js/splaytree.svg)](https://badge.fury.io/js/splaytree) [![CircleCI](https://circleci.com/gh/w8r/splay-tree.svg?style=svg)](https://circleci.com/gh/w8r/splay-tree)

[Splay-tree](https://en.wikipedia.org/wiki/Splay_tree): **[fast](#benchmarks)**(non-recursive) and **simple**(< 500 lines of code)
Implementation is adapted directly from Wikipedia with the same API as [w8r/avl](https://github.com/w8r/avl), to run the benchmarks agains other trees.

![Splay-tree](https://i.stack.imgur.com/CNSAZ.png)

| Operation     | Average       | Worst case             |
| ------------- | ------------- | ---------------------- |
| Space         | **O(n)**      | **O(n)**               |
| Search        | **O(log n)**  | **amortized O(log n)** |
| Insert        | **O(log n)**  | **amortized O(log n)** |
| Delete        | **O(log n)**  | **amortized O(log n)** |


## Install

```shell
npm i -S splaytree
```

```js
import SplayTree from 'splaytree';
const tree = new SplayTree();
```

Or get it from CDN
```html
<script src="https://unpkg.com/splaytree"></script>
<script>
  var tree = new SplayTree();
  ...
</script>
```
Or use the compiled version 'dist/splay.js'.

[Try it in your browser](https://npm.runkit.com/splaytree)

## API

* `new SplayTree([comparator], [noDuplicates:Boolean])`, where `comparator` is optional comparison function
* `tree.insert(key:any, [data:any]):Node` - Insert item
* `tree.remove(key:any):Boolean` - Remove item
* `tree.removeNode(Node:any)|Boolean` - Remove node
* `tree.find(key):Node|Null` - Return node by its key
* `tree.at(index:Number):Node|Null` - Return node by its index in sorted order of keys
* `tree.contains(key):Boolean` - Whether a node with the given key is in the tree
* `tree.forEach(function(node) {...}):Tree` In-order traversal
* `tree.keys():Array<key>` - Returns the array of keys in order
* `tree.values():Array<*>` - Returns the array of data fields in order
* `tree.range(lo, high, function(node) {} [, context]):Tree` - Walks the range of keys in order. Stops, if the visitor function returns a non-zero value.
* `tree.pop():Node` - Removes smallest node
* `tree.min():key` - Returns min key
* `tree.max():key` - Returns max key
* `tree.minNode():Node` - Returns the node with smallest key
* `tree.maxNode():Node` - Returns the node with highest key
* `tree.prev(node):Node` - Predecessor node
* `tree.next(node):Node` - Successor node
* `tree.load(keys:Array<*>, [values:Array<*>][,presort=false]):Tree` - Bulk-load items. It expects values and keys to be sorted, but if `presort` is `true`, it will sort keys and values using the comparator(in-place!). You can only use it on an empty tree.
* `SplayTree.createTree(keys:Array<Key>, [values:Array<Value>][,comparator][,presort:Boolean][,noDuplicates:Boolean]):SplayTree` - creates and loads the tree. Equivalent of `new SplayTree(comparator, noDuplicates).load(keys, values, presort)`.

**Comparator**

`function(a:key,b:key):Number` - Comparator function between two keys, it returns
 * `0` if the keys are equal
 * `<0` if `a < b`
 * `>0` if `a > b`

 The comparator function is extremely important, in case of errors you might end
 up with a wrongly constructed tree or would not be able to retrieve your items.
 It is crucial to test the return values of your `comparator(a,b)` and `comparator(b,a)`
 to make sure it's working correctly, otherwise you may have bugs that are very
 unpredictable and hard to catch.

 **Duplicate keys**

 By default, tree allows duplicate keys. You can disable that by passing `true`
 as a second parameter to the tree constructor. In that case if you would try to
 instert an item with the key, that is already present in the tree, it will not
 be inserted.
 However, the default behavior allows for duplicate keys, cause there are cases
 where you cannot predict that the keys would be unique (example: overlapping
 points in 2D).

## Example

```js
import Tree from 'splaytree';

const t = new Tree();
t.insert(5);
t.insert(-10);
t.insert(0);
t.insert(33);
t.insert(2);

console.log(t.keys()); // [-10, 0, 2, 5, 33]
console.log(t.size);   // 5
console.log(t.min());  // -10
console.log(t.max());  // -33

t.remove(0);
console.log(t.size);   // 4
```

**Custom comparator (reverse sort)**

```js
import Tree from 'splaytree';

const t = new Tree((a, b) => b - a);
t.insert(5);
t.insert(-10);
t.insert(0);
t.insert(33);
t.insert(2);

console.log(t.keys()); // [33, 5, 2, 0, -10]
```

**Bulk insert**

```js
import Tree from 'splaytree';

const t = new Tree();
t.load([3,2,-10,20], ['C', 'B', 'A', 'D']);
console.log(t.keys());   // [-10, 2, 3, 20]
console.log(t.values()); // ['A', 'B', 'C', 'D']
```

## Benchmarks

```shell
npm run benchmark
```

```
Insert (x1000)
Bintrees x 3,320 ops/sec ±4.69% (81 runs sampled)
Functional red black tree x 1,717 ops/sec ±7.36% (71 runs sampled)
Google Closure library AVL x 538 ops/sec ±7.55% (70 runs sampled)
Splay (current) x 1,783 ops/sec ±6.07% (73 runs sampled)
AVL x 4,790 ops/sec ±4.38% (76 runs sampled)
- Fastest is AVL

Random read (x1000)
Bintrees x 7,342 ops/sec ±2.72% (83 runs sampled)
Functional red black tree x 12,263 ops/sec ±5.32% (77 runs sampled)
Google Closure library AVL x 19.12 ops/sec ±12.82% (39 runs sampled)
Splay (current) x 14,897 ops/sec ±1.16% (85 runs sampled)
AVL x 14,381 ops/sec ±2.42% (88 runs sampled)
- Fastest is Splay (current)

Remove (x1000)
Bintrees x 99,828 ops/sec ±2.22% (83 runs sampled)
Functional red black tree x 22,012 ops/sec ±4.16% (80 runs sampled)
Splay (current) x 112,646 ops/sec ±4.04% (80 runs sampled)
Google Closure library AVL x 25,676 ops/sec ±3.97% (75 runs sampled)
AVL x 78,340 ops/sec ±2.44% (85 runs sampled)
- Fastest is Splay (current)
```

Adding google closure library to the benchmark is, of course, unfair, cause the
node.js version of it is not optimised by the compiler, but in this case it
plays the role of straight-forward robust implementation.

## Develop

```shell
npm i
npm t
npm run build
```

## TODO

- [ ] Add option for bubbling elements up as you retrieve them
- [ ] Fix splaying for performance

## License

The MIT License (MIT)

Copyright (c) 2017 Alexander Milevski <info@w8r.name>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
