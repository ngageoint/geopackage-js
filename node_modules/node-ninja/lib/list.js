//  Copyright (c) the Contributors as noted in the AUTHORS file.
//  This file is part of node-ninja.
//
//  This Source Code Form is subject to the terms of the Mozilla Public
//  License, v. 2.0. If a copy of the MPL was not distributed with this
//  file, You can obtain one at http://mozilla.org/MPL/2.0/.

module.exports = exports = list

exports.usage = 'Prints a listing of the currently installed node development files'

/**
 * Module dependencies.
 */

var fs = require('graceful-fs')
  , path = require('path')
  , log = require('npmlog')

function list (gyp, args, callback) {

  var devDir = gyp.devDir
  log.verbose('list', 'using node-ninja dir:', devDir)

  // readdir() the node-ninja dir
  fs.readdir(devDir, onreaddir)

  function onreaddir (err, versions) {
    if (err && err.code != 'ENOENT') {
      return callback(err)
    }
    if (Array.isArray(versions)) {
      versions = versions.filter(function (v) { return v != 'current' })
    } else {
      versions = []
    }
    callback(null, versions)
  }
}
