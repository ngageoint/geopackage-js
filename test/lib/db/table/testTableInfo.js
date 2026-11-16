import { default as testSetup } from '../../../testSetup';

var TableInfo = require('../../../../lib/db/table/tableInfo').TableInfo,
  GeoPackageDataType = require('../../../../lib/db/geoPackageDataType').GeoPackageDataType,
  should = require('chai').should(),
  path = require('path');

describe('TableInfo tests', function () {
  describe('data type names are case insensitive', function () {
    it('reads data types written in any case', function () {
      TableInfo.getDataType('INTEGER').should.be.equal(GeoPackageDataType.INTEGER);
      TableInfo.getDataType('integer').should.be.equal(GeoPackageDataType.INTEGER);
      TableInfo.getDataType('Integer').should.be.equal(GeoPackageDataType.INTEGER);
      TableInfo.getDataType('text').should.be.equal(GeoPackageDataType.TEXT);
      TableInfo.getDataType('dateTime').should.be.equal(GeoPackageDataType.DATETIME);
    });

    it('reads geometry types written in any case as blobs', function () {
      TableInfo.getDataType('GEOMETRY').should.be.equal(GeoPackageDataType.BLOB);
      TableInfo.getDataType('geometry').should.be.equal(GeoPackageDataType.BLOB);
      TableInfo.getDataType('Point').should.be.equal(GeoPackageDataType.BLOB);
      TableInfo.getDataType('multipolygon').should.be.equal(GeoPackageDataType.BLOB);
    });

    it('returns undefined for unknown types', function () {
      should.not.exist(TableInfo.getDataType('notatype'));
      should.not.exist(TableInfo.getDataType(undefined));
    });
  });

  describe('table defined with lower case types (#191)', function () {
    var testGeoPackage;
    var geoPackage;

    beforeEach(async function () {
      testGeoPackage = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      geoPackage = await testSetup.createGeoPackage(testGeoPackage);
    });

    afterEach(async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(testGeoPackage);
    });

    it('reads every column type', function () {
      geoPackage
        .getConnection()
        .run(
          'create table lower_case_types (id integer not null primary key, name text(50), created datetime, geometry geometry)',
        );
      var tableInfo = TableInfo.info(geoPackage.getConnection(), 'lower_case_types');
      tableInfo.getColumn('id').getDataType().should.be.equal(GeoPackageDataType.INTEGER);
      tableInfo.getColumn('name').getDataType().should.be.equal(GeoPackageDataType.TEXT);
      tableInfo.getColumn('name').getMax().should.be.equal(50);
      tableInfo.getColumn('created').getDataType().should.be.equal(GeoPackageDataType.DATETIME);
      tableInfo.getColumn('geometry').getDataType().should.be.equal(GeoPackageDataType.BLOB);
    });
  });
});
