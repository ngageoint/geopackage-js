
var extend = require('util-extend');
var spawn = require('child_process').spawn;

module.exports = function execstream(command, options) {
  var file, args;
  options = extend({}, options);

  if (process.platform === 'win32') {
    file = process.env.comspec || 'cmd.exe';
    args = ['/s', '/c', '"' + command + '"'];
    options.windowsVerbatimArguments = true;
  } else {
    file = '/bin/sh';
    args = ['-c', command];
    options.windowsVerbatimArguments = false;
  }

  if (options && options.shell) {
    file = options.shell;
    delete options.shell;
  }

  return spawn(file, args, options);
};
