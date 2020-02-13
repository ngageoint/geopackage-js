//  Copyright (c) the Contributors as noted in the AUTHORS file.
//  This file is part of node-ninja.
//
//  This Source Code Form is subject to the terms of the Mozilla Public
//  License, v. 2.0. If a copy of the MPL was not distributed with this
//  file, You can obtain one at http://mozilla.org/MPL/2.0/.

module.exports = exports = remove

exports.usage = 'Removes the node development files for the specified version'

/**
 * Module dependencies.
 */

var fs = require('fs')
  , rm = require('rimraf')
  , path = require('path')
  , log = require('npmlog')
  , semver = require('semver')

function remove (gyp, argv, callback) {

  var devDir = gyp.devDir
  log.verbose('remove', 'using node-ninja dir:', devDir)

  // get the user-specified version to remove
  var version = argv[0] || gyp.opts.target
  log.verbose('remove', 'removing target version:', version)

  if (!version) {
    return callback(new Error('You must specify a version number to remove. Ex: "' + process.version + '"'))
  }

  var versionSemver = semver.parse(version)
  if (versionSemver) {
    // flatten the version Array into a String
    version = versionSemver.version
  }

  var versionPath = path.resolve(gyp.devDir, version)
  log.verbose('remove', 'removing development files for version:', version)

  // first check if its even installed
  fs.stat(versionPath, function (err, stat) {
    if (err) {
      if (err.code == 'ENOENT') {
        callback(null, 'version was already uninstalled: ' + version)
      } else {
        callback(err)
      }
      return
    }
    // Go ahead and delete the dir
    rm(versionPath, callback)
  })

}
