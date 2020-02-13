/**
 * splaytree v0.1.4
 * Fast Splay tree for Node and browser
 *
 * @author Alexander Milevski <info@w8r.name>
 * @license MIT
 * @preserve
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.SplayTree = factory());
}(this, (function () { 'use strict';

function DEFAULT_COMPARE (a, b) { return a > b ? 1 : a < b ? -1 : 0; }

var SplayTree = function SplayTree(compare, noDuplicates) {
  if ( compare === void 0 ) compare = DEFAULT_COMPARE;
  if ( noDuplicates === void 0 ) noDuplicates = false;

  this._compare = compare;
  this._root = null;
  this._size = 0;
  this._noDuplicates = !!noDuplicates;
};

var prototypeAccessors = { size: {} };


SplayTree.prototype.rotateLeft = function rotateLeft (x) {
  var y = x.right;
  if (y) {
    x.right = y.left;
    if (y.left) { y.left.parent = x; }
    y.parent = x.parent;
  }

  if (!x.parent)              { this._root = y; }
  else if (x === x.parent.left) { x.parent.left = y; }
  else                        { x.parent.right = y; }
  if (y) { y.left = x; }
  x.parent = y;
};


SplayTree.prototype.rotateRight = function rotateRight (x) {
  var y = x.left;
  if (y) {
    x.left = y.right;
    if (y.right) { y.right.parent = x; }
    y.parent = x.parent;
  }

  if (!x.parent)             { this._root = y; }
  else if(x === x.parent.left) { x.parent.left = y; }
  else                       { x.parent.right = y; }
  if (y) { y.right = x; }
  x.parent = y;
};


SplayTree.prototype._splay = function _splay (x) {
    var this$1 = this;

  while (x.parent) {
    var p = x.parent;
    if (!p.parent) {
      if (p.left === x) { this$1.rotateRight(p); }
      else            { this$1.rotateLeft(p); }
    } else if (p.left === x && p.parent.left === p) {
      this$1.rotateRight(p.parent);
      this$1.rotateRight(p);
    } else if (p.right === x && p.parent.right === p) {
      this$1.rotateLeft(p.parent);
      this$1.rotateLeft(p);
    } else if (p.left === x && p.parent.right === p) {
      this$1.rotateRight(p);
      this$1.rotateLeft(p);
    } else {
      this$1.rotateLeft(p);
      this$1.rotateRight(p);
    }
  }
};


SplayTree.prototype.splay = function splay (x) {
    var this$1 = this;

  var p, gp, ggp, l, r;

  while (x.parent) {
    p = x.parent;
    gp = p.parent;

    if (gp && gp.parent) {
      ggp = gp.parent;
      if (ggp.left === gp) { ggp.left= x; }
      else               { ggp.right = x; }
      x.parent = ggp;
    } else {
      x.parent = null;
      this$1._root = x;
    }

    l = x.left; r = x.right;

    if (x === p.left) { // left
      if (gp) {
        if (gp.left === p) {
          /* zig-zig */
          if (p.right) {
            gp.left = p.right;
            gp.left.parent = gp;
          } else { gp.left = null; }

          p.right = gp;
          gp.parent = p;
        } else {
          /* zig-zag */
          if (l) {
            gp.right = l;
            l.parent = gp;
          } else { gp.right = null; }

          x.left  = gp;
          gp.parent = x;
        }
      }
      if (r) {
        p.left = r;
        r.parent = p;
      } else { p.left = null; }

      x.right= p;
      p.parent = x;
    } else { // right
      if (gp) {
        if (gp.right === p) {
          /* zig-zig */
          if (p.left) {
            gp.right = p.left;
            gp.right.parent = gp;
          } else { gp.right = null; }

          p.left = gp;
          gp.parent = p;
        } else {
          /* zig-zag */
          if (r) {
            gp.left = r;
            r.parent = gp;
          } else { gp.left = null; }

          x.right = gp;
          gp.parent = x;
        }
      }
      if (l) {
        p.right = l;
        l.parent = p;
      } else { p.right = null; }

      x.left = p;
      p.parent = x;
    }
  }
};


SplayTree.prototype.replace = function replace (u, v) {
  if (!u.parent) { this._root = v; }
  else if (u === u.parent.left) { u.parent.left = v; }
  else { u.parent.right = v; }
  if (v) { v.parent = u.parent; }
};


SplayTree.prototype.minNode = function minNode (u) {
    if ( u === void 0 ) u = this._root;

  if (u) { while (u.left) { u = u.left; } }
  return u;
};


SplayTree.prototype.maxNode = function maxNode (u) {
    if ( u === void 0 ) u = this._root;

  if (u) { while (u.right) { u = u.right; } }
  return u;
};


SplayTree.prototype.insert = function insert (key, data) {
  var z = this._root;
  var p = null;
  var comp = this._compare;
  var cmp;

  if (this._noDuplicates) {
    while (z) {
      p = z;
      cmp = comp(z.key, key);
      if (cmp === 0) { return; }
      else if (comp(z.key, key) < 0) { z = z.right; }
      else { z = z.left; }
    }
  } else {
    while (z) {
      p = z;
      if (comp(z.key, key) < 0) { z = z.right; }
      else { z = z.left; }
    }
  }

  z = { key: key, data: data, left: null, right: null, parent: p };

  if (!p)                        { this._root = z; }
  else if (comp(p.key, z.key) < 0) { p.right = z; }
  else                           { p.left= z; }

  this.splay(z);
  this._size++;
  return z;
};


SplayTree.prototype.find = function find (key) {
  var z  = this._root;
  var comp = this._compare;
  while (z) {
    var cmp = comp(z.key, key);
    if    (cmp < 0) { z = z.right; }
    else if (cmp > 0) { z = z.left; }
    else            { return z; }
  }
  return null;
};

/**
 * Whether the tree contains a node with the given key
 * @param{Key} key
 * @return {boolean} true/false
 */
SplayTree.prototype.contains = function contains (key) {
  var node     = this._root;
  var comparator = this._compare;
  while (node){
    var cmp = comparator(key, node.key);
    if    (cmp === 0) { return true; }
    else if (cmp < 0) { node = node.left; }
    else              { node = node.right; }
  }

  return false;
};


SplayTree.prototype.remove = function remove (key) {
  var z = this.find(key);

  if (!z) { return false; }

  this.splay(z);

  if (!z.left) { this.replace(z, z.right); }
  else if (!z.right) { this.replace(z, z.left); }
  else {
    var y = this.minNode(z.right);
    if (y.parent !== z) {
      this.replace(y, y.right);
      y.right = z.right;
      y.right.parent = y;
    }
    this.replace(z, y);
    y.left = z.left;
    y.left.parent = y;
  }

  this._size--;
  return true;
};


SplayTree.prototype.removeNode = function removeNode (z) {
  if (!z) { return false; }

  this.splay(z);

  if (!z.left) { this.replace(z, z.right); }
  else if (!z.right) { this.replace(z, z.left); }
  else {
    var y = this.minNode(z.right);
    if (y.parent !== z) {
      this.replace(y, y.right);
      y.right = z.right;
      y.right.parent = y;
    }
    this.replace(z, y);
    y.left = z.left;
    y.left.parent = y;
  }

  this._size--;
  return true;
};


SplayTree.prototype.erase = function erase (key) {
  var z = this.find(key);
  if (!z) { return; }

  this.splay(z);

  var s = z.left;
  var t = z.right;

  var sMax = null;
  if (s) {
    s.parent = null;
    sMax = this.maxNode(s);
    this.splay(sMax);
    this._root = sMax;
  }
  if (t) {
    if (s) { sMax.right = t; }
    else { this._root = t; }
    t.parent = sMax;
  }

  this._size--;
};

/**
 * Removes and returns the node with smallest key
 * @return {?Node}
 */
SplayTree.prototype.pop = function pop () {
  var node = this._root, returnValue = null;
  if (node) {
    while (node.left) { node = node.left; }
    returnValue = { key: node.key, data: node.data };
    this.remove(node.key);
  }
  return returnValue;
};


/* eslint-disable class-methods-use-this */

/**
 * Successor node
 * @param{Node} node
 * @return {?Node}
 */
SplayTree.prototype.next = function next (node) {
  var successor = node;
  if (successor) {
    if (successor.right) {
      successor = successor.right;
      while (successor && successor.left) { successor = successor.left; }
    } else {
      successor = node.parent;
      while (successor && successor.right === node) {
        node = successor; successor = successor.parent;
      }
    }
  }
  return successor;
};


/**
 * Predecessor node
 * @param{Node} node
 * @return {?Node}
 */
SplayTree.prototype.prev = function prev (node) {
  var predecessor = node;
  if (predecessor) {
    if (predecessor.left) {
      predecessor = predecessor.left;
      while (predecessor && predecessor.right) { predecessor = predecessor.right; }
    } else {
      predecessor = node.parent;
      while (predecessor && predecessor.left === node) {
        node = predecessor;
        predecessor = predecessor.parent;
      }
    }
  }
  return predecessor;
};
/* eslint-enable class-methods-use-this */


/**
 * @param{forEachCallback} callback
 * @return {SplayTree}
 */
SplayTree.prototype.forEach = function forEach (callback) {
  var current = this._root;
  var s = [], done = false, i = 0;

  while (!done) {
    // Reach the left most Node of the current Node
    if (current) {
      // Place pointer to a tree node on the stack
      // before traversing the node's left subtree
      s.push(current);
      current = current.left;
    } else {
      // BackTrack from the empty subtree and visit the Node
      // at the top of the stack; however, if the stack is
      // empty you are done
      if (s.length > 0) {
        current = s.pop();
        callback(current, i++);

        // We have visited the node and its left
        // subtree. Now, it's right subtree's turn
        current = current.right;
      } else { done = true; }
    }
  }
  return this;
};


/**
 * Walk key range from `low` to `high`. Stops if `fn` returns a value.
 * @param{Key}    low
 * @param{Key}    high
 * @param{Function} fn
 * @param{*?}     ctx
 * @return {SplayTree}
 */
SplayTree.prototype.range = function range (low, high, fn, ctx) {
    var this$1 = this;

  var Q = [];
  var compare = this._compare;
  var node = this._root, cmp;

  while (Q.length !== 0 || node) {
    if (node) {
      Q.push(node);
      node = node.left;
    } else {
      node = Q.pop();
      cmp = compare(node.key, high);
      if (cmp > 0) {
        break;
      } else if (compare(node.key, low) >= 0) {
        if (fn.call(ctx, node)) { return this$1; } // stop if smth is returned
      }
      node = node.right;
    }
  }
  return this;
};

/**
 * Returns all keys in order
 * @return {Array<Key>}
 */
SplayTree.prototype.keys = function keys () {
  var current = this._root;
  var s = [], r = [], done = false;

  while (!done) {
    if (current) {
      s.push(current);
      current = current.left;
    } else {
      if (s.length > 0) {
        current = s.pop();
        r.push(current.key);
        current = current.right;
      } else { done = true; }
    }
  }
  return r;
};


/**
 * Returns `data` fields of all nodes in order.
 * @return {Array<Value>}
 */
SplayTree.prototype.values = function values () {
  var current = this._root;
  var s = [], r = [], done = false;

  while (!done) {
    if (current) {
      s.push(current);
      current = current.left;
    } else {
      if (s.length > 0) {
        current = s.pop();
        r.push(current.data);
        current = current.right;
      } else { done = true; }
    }
  }
  return r;
};


/**
 * Returns node at given index
 * @param{number} index
 * @return {?Node}
 */
SplayTree.prototype.at = function at (index) {
  // removed after a consideration, more misleading than useful
  // index = index % this.size;
  // if (index < 0) index = this.size - index;

  var current = this._root;
  var s = [], done = false, i = 0;

  while (!done) {
    if (current) {
      s.push(current);
      current = current.left;
    } else {
      if (s.length > 0) {
        current = s.pop();
        if (i === index) { return current; }
        i++;
        current = current.right;
      } else { done = true; }
    }
  }
  return null;
};

/**
 * Bulk-load items. Both array have to be same size
 * @param{Array<Key>}  keys
 * @param{Array<Value>}[values]
 * @param{Boolean}     [presort=false] Pre-sort keys and values, using
 *                                       tree's comparator. Sorting is done
 *                                       in-place
 * @return {AVLTree}
 */
SplayTree.prototype.load = function load (keys, values, presort) {
    if ( keys === void 0 ) keys = [];
    if ( values === void 0 ) values = [];
    if ( presort === void 0 ) presort = false;

  if (this._size !== 0) { throw new Error('bulk-load: tree is not empty'); }
  var size = keys.length;
  if (presort) { sort(keys, values, 0, size - 1, this._compare); }
  this._root = loadRecursive(null, keys, values, 0, size);
  this._size = size;
  return this;
};


SplayTree.prototype.min = function min () {
  var node = this.minNode(this._root);
  if (node) { return node.key; }
  else    { return null; }
};


SplayTree.prototype.max = function max () {
  var node = this.maxNode(this._root);
  if (node) { return node.key; }
  else    { return null; }
};

SplayTree.prototype.isEmpty = function isEmpty () { return this._root === null; };
prototypeAccessors.size.get = function () { return this._size; };


/**
 * Create a tree and load it with items
 * @param{Array<Key>}        keys
 * @param{Array<Value>?}      [values]

 * @param{Function?}          [comparator]
 * @param{Boolean?}           [presort=false] Pre-sort keys and values, using
 *                                             tree's comparator. Sorting is done
 *                                             in-place
 * @param{Boolean?}           [noDuplicates=false] Allow duplicates
 * @return {SplayTree}
 */
SplayTree.createTree = function createTree (keys, values, comparator, presort, noDuplicates) {
  return new SplayTree(comparator, noDuplicates).load(keys, values, presort);
};

Object.defineProperties( SplayTree.prototype, prototypeAccessors );

function loadRecursive (parent, keys, values, start, end) {
  var size = end - start;
  if (size > 0) {
    var middle = start + Math.floor(size / 2);
    var key    = keys[middle];
    var data   = values[middle];
    var node   = { key: key, data: data, parent: parent };
    node.left    = loadRecursive(node, keys, values, start, middle);
    node.right   = loadRecursive(node, keys, values, middle + 1, end);
    return node;
  }
  return null;
}


function sort(keys, values, left, right, compare) {
  if (left >= right) { return; }

  var pivot = keys[(left + right) >> 1];
  var i = left - 1;
  var j = right + 1;

  while (true) {
    do { i++; } while (compare(keys[i], pivot) < 0);
    do { j--; } while (compare(keys[j], pivot) > 0);
    if (i >= j) { break; }

    var tmp = keys[i];
    keys[i] = keys[j];
    keys[j] = tmp;

    tmp = values[i];
    values[i] = values[j];
    values[j] = tmp;
  }

  sort(keys, values,  left,     j, compare);
  sort(keys, values, j + 1, right, compare);
}

return SplayTree;

})));
//# sourceMappingURL=splay.js.map
