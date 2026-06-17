import { default as testSetup } from '../../../testSetup';
import { ContentsDataType } from '../../../../lib/contents/contentsDataType';

var GeometryColumnsDao = require('../../../../lib/features/columns/geometryColumnsDao').GeometryColumnsDao,
  Contents = require('../../../../lib/contents/contents').Contents,
  should = require('chai').should(),
  path = require('path');

describe('GeometryColumns tests', function () {
  var geoPackage;
  var filename;
  beforeEach('should open the geoPackage', async function () {
    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'gdal_sample.gpkg');

    let result = await copyAndOpenGeopackage(originalFilename);
    geoPackage = result.geoPackage;
    filename = result.path;
  });

  afterEach('should close the geoPackage', function () {
    geoPackage.close();
    testSetup.deleteGeoPackage(filename);
  });

  it('should get the feature tables', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var tables = gcd.getFeatureTables();
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
      'geometry3d',
    ]);
  });

  it('should get the table', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var table = gcd.queryForTableName('point2d');
    should.exist(table);

    compareProperties(table, {
      column_name: 'geom',
      table_name: 'point2d',
      geometry_type_name: 'POINT',
      srs_id: 0,
      z: 0,
      m: 0,
    });
  });

  it('should get no table', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var table = gcd.queryForTableName('doesnotexist');
    should.not.exist(table);
  });

  it('should get all the tables', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var results = gcd.queryForAll();
    should.exist(results);
    results.should.have.property('length', 16);
  });

  it('should get the table', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var table = gcd.queryForTableName('point2d');
    should.exist(table);

    compareProperties(table, {
      table_name: 'point2d',
      column_name: 'geom',
      geometry_type_name: 'POINT',
      srs_id: 0,
      z: 0,
      m: 0,
    });
  });

  it('should get the srs from the table', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var table = gcd.queryForTableName('point2d');
    should.exist(table);

    compareProperties(table, {
      table_name: 'point2d',
      column_name: 'geom',
      geometry_type_name: 'POINT',
      srs_id: 0,
      z: 0,
      m: 0,
    });
    var srs = gcd.getSrs(table);

    compareProperties(srs, {
      srs_name: 'Undefined geographic SRS',
      srs_id: 0,
      organization: 'NONE',
      organization_coordsys_id: 0,
      definition: 'undefined',
      description: 'undefined geographic coordinate reference system',
      definition_12_063: 'undefined',
    });
  });

  it('should get the contents from the table', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var table = gcd.queryForTableName('point2d');
    should.exist(table);

    compareProperties(table, {
      table_name: 'point2d',
      column_name: 'geom',
      geometry_type_name: 'POINT',
      srs_id: 0,
      z: 0,
      m: 0,
    });
    var contents = gcd.getContents(table);
    var expectedContents = new Contents();
    expectedContents.setTableName('point2d');
    expectedContents.setDataType(ContentsDataType.FEATURES);
    expectedContents.setIdentifier('point2d');
    expectedContents.setDescription('');
    expectedContents.setLastChange(new Date('2014-08-27T15:36:41.000Z'));
    expectedContents.setMinX(1);
    expectedContents.setMinY(2);
    expectedContents.setMaxX(1);
    expectedContents.setMaxY(2);
    expectedContents.setSrsId(0);
    contents.should.be.deep.equal(expectedContents);
  });

  it('should get the projection from the table', function () {
    var gcd = new GeometryColumnsDao(geoPackage);
    var table = gcd.queryForTableName('point2d');
    should.exist(table);

    compareProperties(table, {
      table_name: 'point2d',
      column_name: 'geom',
      geometry_type_name: 'POINT',
      srs_id: 0,
      z: 0,
      m: 0,
    });
    var projection = gcd.getProjection(table);
    should.not.exist(projection);
  });
});
