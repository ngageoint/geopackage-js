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
      should.not.exist(err);
      should.exist(table);
      table.should.be.deep.equal({ tableName: 'point2d',
        columnName: 'geom',
        geometryTypeName: 'POINT',
        srsId: 0,
        z: 0,
        m: 0
      });
      done();
    });
  });

  it('should get no table', function(done) {
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForTableName('doesnotexist', function(err, table) {
      should.not.exist(err);
      should.not.exist(table);
      done();
    });
  });

  it('should get all the tables', function(done){
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForAll(function(err, results) {
      should.not.exist(err);
      should.exist(results);
      results.should.have.property('length', 16);
      done();
    });
  });

  it('should get the table', function(done) {
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForTableName('point2d', function(err, table) {
      should.not.exist(err);
      should.exist(table);
      table.should.be.deep.equal({ tableName: 'point2d',
        columnName: 'geom',
        geometryTypeName: 'POINT',
        srsId: 0,
        z: 0,
        m: 0
      });
      done();
    });
  });

  it('should get the srs from the table', function(done) {
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForTableName('point2d', function(err, table) {
      should.not.exist(err);
      should.exist(table);
      table.should.be.deep.equal({ tableName: 'point2d',
        columnName: 'geom',
        geometryTypeName: 'POINT',
        srsId: 0,
        z: 0,
        m: 0
      });
      gcd.getSrs(table, function(err, srs) {
        srs.should.be.deep.equal({
          srsName: 'Undefined geographic SRS',
          srsId: 0,
          organization: 'NONE',
          organizationCoordsysId: 0,
          definition: 'undefined',
          description: 'undefined geographic coordinate reference system'
        });
        done();
      });
    });
  });

  it('should get the contents from the table', function(done) {
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForTableName('point2d', function(err, table) {
      should.not.exist(err);
      should.exist(table);
      table.should.be.deep.equal({ tableName: 'point2d',
        columnName: 'geom',
        geometryTypeName: 'POINT',
        srsId: 0,
        z: 0,
        m: 0
      });
      gcd.getContents(table, function(err, contents) {
        contents.should.be.deep.equal({
          tableName: 'point2d',
          dataType: 'features',
          identifier: 'point2d',
          description: '',
          lastChange: '2014-08-27T15:36:41.000Z',
          minX: 1,
          minY: 2,
          maxX: 1,
          maxY: 2,
          srsId: 0
        });
        done();
      });
    });
  });

  it('should get the projection from the table', function(done) {
    var gcd = new GeometryColumnsDao(connection);
    gcd.queryForTableName('point2d', function(err, table) {
      should.not.exist(err);
      should.exist(table);
      table.should.be.deep.equal({ tableName: 'point2d',
        columnName: 'geom',
        geometryTypeName: 'POINT',
        srsId: 0,
        z: 0,
        m: 0
      });
      gcd.getProjection(table, function(err, projection) {
        should.not.exist(err);
        should.exist(projection);
        done();
      });
    });
  });

});
