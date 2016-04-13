var GeoPackageManager = require('../../../../lib/geoPackageManager')
  , GeometryColumnsDao = require('../../../../lib/features/columns').GeometryColumnsDao
  , GeoPackageConnection = require('../../../../lib/db/geoPackageConnection')
  , should = require('chai').should()
  , path = require('path');

describe('GeometryColumns tests', function() {

  var db;
  var connection;

  beforeEach('should open the geopackage', function(done) {
    GeoPackageConnection.connect(path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg'), function(err, gpConnection) {
      connection = gpConnection;
      done();
    });
  });

  it('should get the feature tables', function(done) {
    var gcd = new GeometryColumnsDao(connection);
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

  it('should get the table', function(done) {
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForTableName('point2d', function(err, table) {
      console.log('table', table);
      done();
    });
    // gcd.getFeatureTables(function(err, tables) {
    //   should.not.exist(err);
    //   should.exist(tables);
    //   tables.length.should.be.equal(16);
    //   tables.should.have.members([
    //     'point2d',
    //      'linestring2d',
    //      'polygon2d',
    //      'multipoint2d',
    //      'multilinestring2d',
    //      'multipolygon2d',
    //      'geomcollection2d',
    //      'geometry2d',
    //      'point3d',
    //      'linestring3d',
    //      'polygon3d',
    //      'multipoint3d',
    //      'multilinestring3d',
    //      'multipolygon3d',
    //      'geomcollection3d',
    //      'geometry3d'
    //   ]);
    //   done();
    // });
  });

});
