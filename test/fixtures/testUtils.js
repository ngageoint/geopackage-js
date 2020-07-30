// @ts-nocheck
var should = require('chai').should();
var GeoPackageAPI = require('@ngageoint/geopackage').GeoPackageAPI
var Path = require('path')
import { default as testSetup } from './testSetup'
import {default as fsExtra} from 'fs-extra'

global.compareProperties = module.exports.compareProperties = function(o1, o2) {
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
  let geopackage = await GeoPackageAPI.open(path);
  should.exist(geopackage);
  should.exist(geopackage.database.getDBConnection());
  geopackage.path.should.be.equal(path);
  geopackage.name.should.be.equal(Path.basename(path));
  return {
    geopackage,
    path
  };
}

global.copyAndOpenGeopackage = async function(original, copy) {
  let filename;
  if (typeof(process) !== 'undefined' && process.version) {
    filename = copy || Path.join(__dirname, 'tmp', testSetup.createTempName());
    let result = await fsExtra.copy(original, filename);
  } else {
    filename = original;
  }
  return openGeoPackage(filename);
}