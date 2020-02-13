#!/usr/bin/env node

/**
 *  Copyright (c) the Contributors as noted in the AUTHORS file.
 *  This file is part of node-ninja.
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/**
 * Set the title.
 */

process.title = 'node-ninja'

/**
 * Module dependencies.
 */

var gyp = require('../')
var log = require('npmlog')

/**
 * Process and execute the selected commands.
 */

var prog = gyp()
var completed = false
prog.parseArgv(process.argv)

if (prog.todo.length === 0) {
  if (~process.argv.indexOf('-v') || ~process.argv.indexOf('--version')) {
    console.log('v%s', prog.version)
  } else {
    console.log('%s', prog.usage())
  }
  return process.exit(0)
}

log.info('it worked if it ends with', 'ok')
log.verbose('cli', process.argv)
log.info('using', 'node-ninja@%s', prog.version)
log.info('using', 'node@%s | %s | %s', process.versions.node, process.platform, process.arch)


/**
 * Change dir if -C/--directory was passed.
 */

var dir = prog.opts.directory
if (dir) {
  var fs = require('fs')
  try {
    var stat = fs.statSync(dir)
    if (stat.isDirectory()) {
      log.info('chdir', dir)
      process.chdir(dir)
    } else {
      log.warn('chdir', dir + ' is not a directory')
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.warn('chdir', dir + ' is not a directory')
    } else {
      log.warn('chdir', 'error during chdir() "%s"', e.message)
    }
  }
}

function run () {
  var command = prog.todo.shift()
  if (!command) {
    // done!
    completed = true
    log.info('ok')
    return
  }

  prog.commands[command.name](command.args, function (err) {
    if (err) {
      log.error(command.name + ' error')
      log.error('stack', err.stack)
      errorMessage()
      log.error('not ok')
      return process.exit(1)
    }
    if (command.name == 'list') {
      var versions = arguments[1]
      if (versions.length > 0) {
        versions.forEach(function (version) {
          console.log(version)
        })
      } else {
        console.log('No node development files installed. Use `node-ninja install` to install a version.')
      }
    } else if (arguments.length >= 2) {
      console.log.apply(console, [].slice.call(arguments, 1))
    }

    // now run the next command in the queue
    process.nextTick(run)
  })
}

process.on('exit', function (code) {
  if (!completed && !code) {
    log.error('Completion callback never invoked!')
    issueMessage()
    process.exit(6)
  }
})

process.on('uncaughtException', function (err) {
  log.error('UNCAUGHT EXCEPTION')
  log.error('stack', err.stack)
  issueMessage()
  process.exit(7)
})

function errorMessage () {
  // copied from npm's lib/util/error-handler.js
  var os = require('os')
  log.error('System', os.type() + ' ' + os.release())
  log.error('command', process.argv
            .map(JSON.stringify).join(' '))
  log.error('cwd', process.cwd())
  log.error('node -v', process.version)
  log.error('node-ninja -v', 'v' + prog.package.version)
}

function issueMessage () {
  errorMessage()
  log.error('', [ 'This is a bug in `node-ninja`.'
                , 'Try to update node-ninja and file an Issue if it does not help:'
                , '    <https://github.com/codejockey/node-ninja/issues>'
                ].join('\n'))
}

// start running the given commands!
run()
