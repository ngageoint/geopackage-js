var GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../lib/geoPackage')
  , FeatureColumn = require('../../lib/features/user/featureColumn')
  , DataColumns = require('../../lib/dataColumns').DataColumns
  , DataColumnsDao = require('../../lib/dataColumns').DataColumnsDao
  , Verification = require('../fixtures/verification')
  , TileTable = require('../../lib/tiles/user/tileTable')
  , SetupFeatureTable = require('../fixtures/setupFeatureTable')
  , TableCreator = require('../../lib/db/tableCreator')
  , BoundingBox = require('../../lib/boundingBox')
  , DataTypes = require('../../lib/db/dataTypes')
  , GeometryData = require('../../lib/geom/geometryData')
  , UserTableReader = require('../../lib/user/userTableReader')
  , testSetup = require('../fixtures/testSetup')
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path')
  , async = require('async');

describe('GeoPackage Feature table create tests', function() {
  var testGeoPackage = path.join(__dirname, '..', 'tmp', 'test.gpkg');
  var tableName = 'test_features.test';
  var geopackage;

  beforeEach(function(done) {
    testSetup.deleteGeoPackage(testGeoPackage, function() {
      testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
        geopackage = gp;
        done();
      });
    });
  });

  afterEach(function(done) {
    geopackage.close();
    testSetup.deleteGeoPackage(testGeoPackage, done);
  });

  it('should create a feature table', function(done) {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', wkx.Types.wkt.Point);
    var boundingBox = new BoundingBox(-180, 180, -80, 80);

    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkx.Types.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
      var verified = Verification.verifyGeometryColumns(geopackage)
        && Verification.verifyTableExists(geopackage, tableName)
        && Verification.verifyContentsForTable(geopackage, tableName)
        && Verification.verifyGeometryColumnsForTable(geopackage, tableName);
      verified.should.be.equal(true);
      done();
    });
  });

  it('should create a feature table and read the information about it', function(done) {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom.test', wkx.Types.wkt.Point);
    var boundingBox = new BoundingBox(-180, 180, -80, 80);

    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom.test', wkx.Types.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, "default"));
    columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real.test', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean.test', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob.test', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer.test', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, 5));

    var dc = new DataColumns();
    dc.table_name = 'test_features.test';
    dc.column_name = 'test_text_limited.test';
    dc.name = 'Test Name';
    dc.title = 'Test';
    dc.description = 'Test Description';
    dc.mime_type = 'text/html';
    dc.constraint_name = 'test constraint';

    geopackage.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumns, boundingBox, 4326, columns, [dc], function(err, result) {
      var reader = new UserTableReader(tableName);
      var result = reader.readTable(geopackage.connection);
      var columns = result.columns;

      var plainObject = JSON.parse(JSON.stringify(columns));
      plainObject.should.deep.include.members([{ index: 0,
         name: 'id',
         dataType: 5,
         notNull: true,
         primaryKey: true },
       { index: 1,
         name: 'geom.test',
         dataType: 13,
         notNull: false,
         primaryKey: false },
       { index: 2,
         name: 'test_text.test',
         dataType: 9,
         notNull: false,
         defaultValue: "\'default\'",
         primaryKey: false },
       { index: 3,
         name: 'test_real.test',
         dataType: 8,
         notNull: false,
         primaryKey: false },
       { index: 4,
         name: 'test_boolean.test',
         dataType: 0,
         notNull: false,
         primaryKey: false },
       { index: 5,
         name: 'test_blob.test',
         dataType: 10,
         notNull: false,
         primaryKey: false },
       { index: 6,
         name: 'test_integer.test',
         dataType: 5,
         notNull: false,
         defaultValue: '5',
         primaryKey: false },
       { index: 7,
         name: 'test_text_limited.test',
         dataType: 9,
         max: 5,
         notNull: false,
         primaryKey: false },
       { index: 8,
         name: 'test_blob_limited.test',
         dataType: 10,
         max: 7,
         notNull: false,
         primaryKey: false } ]);
      var dao = new DataColumnsDao(geopackage.getDatabase());
      dao.getDataColumns('test_features.test', 'test_text_limited.test', function(err, dataColumn) {
        should.not.exist(err);
        dataColumn.should.be.deep.equal({
          table_name: 'test_features.test',
          column_name: 'test_text_limited.test',
          name: 'Test Name',
          title: 'Test',
          description: 'Test Description',
          mime_type: 'text/html',
          constraint_name: 'test constraint'
        });
        done();
      });
    });
  });

  describe('GeoPackage feature CRUD tests', function(done) {
    beforeEach(function(done) {
      testSetup.deleteGeoPackage(testGeoPackage, function() {
        testSetup.createGeoPackage(testGeoPackage, function(err, gp) {
          geopackage = gp;

          var geometryColumns = SetupFeatureTable.buildGeometryColumns(tableName, 'geom', wkx.Types.wkt.Point);
          var boundingBox = new BoundingBox(-180, 180, -80, 80);

          var columns = [];

          columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
          columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
          columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
          columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkx.Types.wkt.Point, false, null));
          columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text.test', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
          columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
          columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
          columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
          columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));
          columns.push(FeatureColumn.createColumnWithIndex(9, 'test space', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
          columns.push(FeatureColumn.createColumnWithIndex(10, 'test-dash', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));

          geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
            var verified = Verification.verifyGeometryColumns(geopackage)
              && Verification.verifyTableExists(geopackage, tableName)
              && Verification.verifyContentsForTable(geopackage, tableName)
              && Verification.verifyGeometryColumnsForTable(geopackage, tableName);
            verified.should.be.equal(true);
            done();
          });
        });
      });
    });

    it('should create a feature', function(done) {
      geopackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(4326);
        var point = new wkx.Point(1, 2);
        geometryData.setGeometry(point);
        featureRow.setGeometry(geometryData);
        featureRow.setValueWithColumnName('test_text.test', 'hello');
        featureRow.setValueWithColumnName('test_real', 3.0);
        featureRow.setValueWithColumnName('test_boolean', true);
        featureRow.setValueWithColumnName('test_blob', new Buffer('test'));
        featureRow.setValueWithColumnName('test_integer', 5);
        featureRow.setValueWithColumnName('test_text_limited', 'testt');
        featureRow.setValueWithColumnName('test_blob_limited', new Buffer('testtes'));
        featureRow.setValueWithColumnName('test space', 'space space');
        featureRow.setValueWithColumnName('test-dash', 'dash-dash');

        featureDao.create(featureRow, function(err, result) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1);
            var rows = featureDao.queryForAll();
            var fr = featureDao.getFeatureRow(rows[0]);
            var geom = fr.getGeometry();
            geom.geometry.x.should.be.equal(1);
            geom.geometry.y.should.be.equal(2);
            fr.getValueWithColumnName('test_text.test').should.be.equal('hello');
            fr.getValueWithColumnName('test_real').should.be.equal(3.0);
            fr.getValueWithColumnName('test_boolean').should.be.equal(true);
            fr.getValueWithColumnName('test_integer').should.be.equal(5);
            fr.getValueWithColumnName('test_blob').toString().should.be.equal('test');
            fr.getValueWithColumnName('test_text_limited').should.be.equal('testt');
            fr.getValueWithColumnName('test_blob_limited').toString().should.be.equal('testtes');
            fr.getValueWithColumnName('test space').toString().should.be.equal('space space');
            fr.getValueWithColumnName('test-dash').toString().should.be.equal('dash-dash');
            done();
          });
        });
      });
    });

    describe('delete feature tests', function(done) {
      var featureDao;

      beforeEach(function(done) {
        geopackage.getFeatureDaoWithTableName(tableName, function(err, fd) {
          featureDao = fd;
          var featureRow = featureDao.newRow();
          var geometryData = new GeometryData();
          geometryData.setSrsId(4326);
          var point = new wkx.Point(1, 2);
          geometryData.setGeometry(point);
          featureRow.setGeometry(geometryData);
          featureRow.setValueWithColumnName('test_text.test', 'hello');
          featureRow.setValueWithColumnName('test_real', 3.0);
          featureRow.setValueWithColumnName('test_boolean', true);
          featureRow.setValueWithColumnName('test_blob', new Buffer('test'));
          featureRow.setValueWithColumnName('test_integer', 5);
          featureRow.setValueWithColumnName('test_text_limited', 'testt');
          featureRow.setValueWithColumnName('test_blob_limited', new Buffer('testtes'));

          featureDao.create(featureRow, function(err, result) {
            featureDao.getCount(function(err, count) {
              count.should.be.equal(1);
              var rows = featureDao.queryForAll();
              var fr = featureDao.getFeatureRow(rows[0]);
              var geom = fr.getGeometry();
              geom.geometry.x.should.be.equal(1);
              geom.geometry.y.should.be.equal(2);
              fr.getValueWithColumnName('test_text.test').should.be.equal('hello');
              fr.getValueWithColumnName('test_real').should.be.equal(3.0);
              fr.getValueWithColumnName('test_boolean').should.be.equal(true);
              fr.getValueWithColumnName('test_integer').should.be.equal(5);
              fr.getValueWithColumnName('test_blob').toString().should.be.equal('test');
              fr.getValueWithColumnName('test_text_limited').should.be.equal('testt');
              fr.getValueWithColumnName('test_blob_limited').toString().should.be.equal('testtes');
              done();
            });
          });
        });
      });

      it('should delete the feature', function(done) {
        featureDao.getCount(function(err, count) {
          count.should.be.equal(1);

          var rows = featureDao.queryForAll();
          var fr = featureDao.getFeatureRow(rows[0]);
          featureDao.delete(fr, function(err, result) {
            featureDao.getCount(function(err, count) {
              count.should.be.equal(0);
              done();
            });
          });
        });
      });
    });
  });

});
