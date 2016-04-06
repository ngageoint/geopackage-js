var GeoPackage = require('../../lib/geoPackage')
  , sqlite3 = require('sqlite3').verbose()
  , should = require('chai').should()
  , path = require('path');

describe('GeoPackage tests', function() {

  it('should get the feature table names', function(done) {
    var db = new sqlite3.Database(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err) {
      var geoPackage = new GeoPackage('', '', db);
      geoPackage.getFeatureTables(function(err, tables) {
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

  it.only('should get the features', function(done) {
    var db = new sqlite3.Database(path.join(__dirname, '..', 'fixtures', 'gdal_sample.gpkg'), function(err) {
      var geoPackage = new GeoPackage('', '', db);
      geoPackage.getFeatureDaoWithTableName('point2d', function(err, featureDao) {
        console.log('featureDao', featureDao);
        // should.not.exist(err);
        // should.exist(tables);
        // tables.length.should.be.equal(16);
        // tables.should.have.members([
        //   'point2d',
        //    'linestring2d',
        //    'polygon2d',
        //    'multipoint2d',
        //    'multilinestring2d',
        //    'multipolygon2d',
        //    'geomcollection2d',
        //    'geometry2d',
        //    'point3d',
        //    'linestring3d',
        //    'polygon3d',
        //    'multipoint3d',
        //    'multilinestring3d',
        //    'multipolygon3d',
        //    'geomcollection3d',
        //    'geometry3d'
        // ]);
        done();
      });
    });
  });

});
