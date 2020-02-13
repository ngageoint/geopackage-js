"use strict";
Object.defineProperties(module.exports, {
  __esModule: {value: true},
  setFrozen: {
    enumerable: true,
    get: function() {
      return setFrozen;
    }
  },
  getFrozen: {
    enumerable: true,
    get: function() {
      return getFrozen;
    }
  },
  hasFrozen: {
    enumerable: true,
    get: function() {
      return hasFrozen;
    }
  },
  deleteFrozen: {
    enumerable: true,
    get: function() {
      return deleteFrozen;
    }
  }
});
function findIndex(arr, key) {
  for (var i = 0; i < arr.length; i += 2) {
    if (arr[i] === key) {
      return i;
    }
  }
  return -1;
}
function setFrozen(arr, key, val) {
  var i = findIndex(arr, key);
  if (i === -1) {
    arr.push(key, val);
  }
}
function getFrozen(arr, key) {
  var i = findIndex(arr, key);
  if (i !== -1) {
    return arr[i + 1];
  }
  return undefined;
}
function hasFrozen(arr, key) {
  return findIndex(arr, key) !== -1;
}
function deleteFrozen(arr, key) {
  var i = findIndex(arr, key);
  if (i !== -1) {
    arr.splice(i, 2);
    return true;
  }
  return false;
}
