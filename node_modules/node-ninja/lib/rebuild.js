//  Copyright (c) the Contributors as noted in the AUTHORS file.
//  This file is part of node-ninja.
//
//  This Source Code Form is subject to the terms of the Mozilla Public
//  License, v. 2.0. If a copy of the MPL was not distributed with this
//  file, You can obtain one at http://mozilla.org/MPL/2.0/.

module.exports = exports = rebuild

exports.usage = 'Runs "clean", "configure" and "build" all at once'

function rebuild (gyp, argv, callback) {

  gyp.todo.push(
      { name: 'clean', args: [] }
    , { name: 'configure', args: argv }
    , { name: 'build', args: [] }
  )
  process.nextTick(callback)
}
