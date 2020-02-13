//  Copyright (c) the Contributors as noted in the AUTHORS file.
//  This file is part of node-ninja.
//
//  This Source Code Form is subject to the terms of the Mozilla Public
//  License, v. 2.0. If a copy of the MPL was not distributed with this
//  file, You can obtain one at http://mozilla.org/MPL/2.0/.

module.exports = exports = clean

exports.usage = 'Removes the build directory and any generated build files'

/**
 * Module dependencies.
 */

var rm = require('rimraf')
var log = require('npmlog')
var path = require('path')

function clean (gyp, argv, callback) {
  var builddir = path.resolve(gyp.opts.builddir || 'build');
  log.verbose('clean', 'removing "%s" directory', builddir)
  rm(builddir, callback)
}
