
var test = require('tap').test;
var execstream = require('./execspawn.js');
var endpoint = require('endpoint');

test('default', function (t) {
  execstream('echo "hallo world";').stdout.pipe(endpoint(function (err, out) {
    t.equal(err, null);
    t.equal(out.toString(), 'hallo world\n');
    t.end();
  }));
});

test('shell option', function (t) {
  execstream('hallo world', { shell: 'echo' }).stdout.pipe(endpoint(function (err, out) {
    t.equal(err, null);
    t.equal(out.toString(), '-c hallo world\n');
    t.end();
  }));
});
