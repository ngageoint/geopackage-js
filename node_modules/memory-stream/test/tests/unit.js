var fs = require('fs');
var path = require('path');
var assert = require('assert');
var MemoryStream = require('../../index.js');

suite('Test Memory Stream', function() {

  test('Stream file', function(done) {
    var source = path.join(process.cwd(), 'test/source.txt');
    var gold = fs.readFileSync(source);
    var rs = fs.createReadStream(source);
    var ws = new MemoryStream();

    ws.on('finish', function() {
      // console.log(gold.toString());
      // console.log(ws.get().toString());
      assert.equal(ws.get().toString(), gold.toString(), 'Output should equal file source.');
      done();
    });

    rs.pipe(ws);

  });

  test('Stream file objectMode true', function(done) {
    var source = path.join(process.cwd(), 'test/object.json');
    var gold = require(source);
    var rs = fs.createReadStream(source);
    var ws = new MemoryStream({
      objectMode: true
    });

    ws.on('finish', function() {
      console.error(ws.get(), gold);
      assert.deepEqual(ws.get(), [gold], 'Output should equal file source.');
      done();
    });

    rs.pipe(ws);

  });

});