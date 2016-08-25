var should = require('chai').should();

module.exports.compareProperties = function(o1, o2) {
  o2.should.have.all.keys(Object.keys(o1));
  o1.should.have.all.keys(Object.keys(o2));
  for (var key in o1) {
    if (o1.hasOwnProperty(key)) {
      o1[key].should.be.equal(o2[key]);
    }
  }
}
