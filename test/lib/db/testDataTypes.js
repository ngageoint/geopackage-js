var DataTypes = require('@ngageoint/geopackage').DataTypes;

var should = require('chai').should();

describe('DataTypes tests', function() {

  it('get the enum name', function() {
    var name = DataTypes.nameFromType(0);
    name.should.be.equal('BOOLEAN');
    name = DataTypes.nameFromType(1);
    name.should.be.equal('TINYINT');
    name = DataTypes.nameFromType(2);
    name.should.be.equal('SMALLINT');
    name = DataTypes.nameFromType(3);
    name.should.be.equal('MEDIUMINT');
    name = DataTypes.nameFromType(4);
    name.should.be.equal('INT');
    name = DataTypes.nameFromType(5);
    name.should.be.equal('INTEGER');
    name = DataTypes.nameFromType(6);
    name.should.be.equal('FLOAT');
    name = DataTypes.nameFromType(7);
    name.should.be.equal('DOUBLE');
    name = DataTypes.nameFromType(8);
    name.should.be.equal('REAL');
    name = DataTypes.nameFromType(9);
    name.should.be.equal('TEXT');
    name = DataTypes.nameFromType(10);
    name.should.be.equal('BLOB');
    name = DataTypes.nameFromType(11);
    name.should.be.equal('DATE');
    name = DataTypes.nameFromType(12);
    name.should.be.equal('DATETIME');
    name = DataTypes.nameFromType(13);
    name.should.be.equal('GEOMETRY');
  });

  it('get the enum values', function() {
    var name = DataTypes.fromName('BOOLEAN');
    name.should.be.equal(0);
    name = DataTypes.fromName('TINYINT');
    name.should.be.equal(1);
    name = DataTypes.fromName('SMALLINT');
    name.should.be.equal(2);
    name = DataTypes.fromName('MEDIUMINT');
    name.should.be.equal(3);
    name = DataTypes.fromName('INT');
    name.should.be.equal(4);
    name = DataTypes.fromName('INTEGER');
    name.should.be.equal(5);
    name = DataTypes.fromName('FLOAT');
    name.should.be.equal(6);
    name = DataTypes.fromName('DOUBLE');
    name.should.be.equal(7);
    name = DataTypes.fromName('REAL');
    name.should.be.equal(8);
    name = DataTypes.fromName('TEXT');
    name.should.be.equal(9);
    name = DataTypes.fromName('BLOB');
    name.should.be.equal(10);
    name = DataTypes.fromName('DATE');
    name.should.be.equal(11);
    name = DataTypes.fromName('DATETIME');
    name.should.be.equal(12);
    name = DataTypes.fromName('GEOMETRY');
    name.should.be.equal(13);
  });

});
