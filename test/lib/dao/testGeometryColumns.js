var GeoPackageManager = require('../../../lib/geoPackageManager')
  , GeometryColumnsDao = require('../../../lib/dao/geometryColumns').GeometryColumnsDao
  , sqlite3 = require('sqlite3').verbose()
  , should = require('chai').should()
  , path = require('path');

describe('GeometryColumns tests', function() {

  var db;

  beforeEach('should open the geopackage', function(done) {
    db = new sqlite3.Database(path.join(__dirname, '..', '..', 'fixtures', 'gdal_sample.gpkg'), done);
  });

  it('should get the feature tables', function(done) {
    var gcd = new GeometryColumnsDao(db);
    gcd.getFeatureTables(function(err, tables) {
      should.not.exist(err);
      should.exist(tables);
      tables.length.should.be.equal(16);
      tables.should.have.members([
        'point2d',
         'linestring2d',
         'polygon2d',
         'multipoint2d',
         'multilinestring2d',
         'multipolygon2d',
         'geomcollection2d',
         'geometry2d',
         'point3d',
         'linestring3d',
         'polygon3d',
         'multipoint3d',
         'multilinestring3d',
         'multipolygon3d',
         'geomcollection3d',
         'geometry3d'
      ]);
      done();
    });
  });

});
