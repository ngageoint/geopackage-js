import { default as testSetup } from './testSetup';

var GeoPackageManager = require('../index').GeoPackageManager;
var isNode = typeof process !== 'undefined' && process.version;

var should = require('chai').should();
var Path = require('path');

var module = {
  exports: {},
};

global.compareProperties = module.exports.compareProperties = function (o1, o2) {
  o2.should.have.all.keys(Object.keys(o1));
  o1.should.have.all.keys(Object.keys(o2));
  for (var key in o1) {
    if (o1.hasOwnProperty(key) && o1[key]) {
      o1[key].should.be.equal(o2[key]);
    }
  }
};

global.mochaAsync = module.exports.mochaAsync = (fn) => {
  return async () => {
    try {
      return fn();
    } catch (err) {
      console.log(err);
    }
  };
};

global.openGeoPackage = async (path) => {
  let geoPackage = await GeoPackageManager.open(path);
  should.exist(geoPackage);
  should.exist(geoPackage.getDatabase().getDBConnection());
  geoPackage.getPath().should.be.equal(path);
  geoPackage.getName().should.be.equal(Path.basename(path));
  return {
    geoPackage,
    path,
  };
};

global.copyAndOpenGeopackage = async function (original, copy) {
  let filename;
  if (isNode) {
    filename = copy || Path.join(__dirname, 'tmp', testSetup.createTempName());
    const fsExtra = require('fs-extra');
    await fsExtra.copy(original, filename);
  } else {
    filename = original;
  }
  return openGeoPackage(filename);
};
