var test = require('tape');
var wktParser = require('./wkt.build.js');
var fixtures = require('./test-fixtures');

fixtures.forEach((item, i)=>{
  test(`fixture ${i}`, t=>{
    var out = wktParser(item.code);
    //var out = parser(item.code);
    console.log(JSON.stringify(out, false, 2));
    t.end();
  });
})
