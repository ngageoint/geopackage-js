var GeoPackageConnection = require('../../lib/db/geoPackageConnection')
  , GeoPackage = require('../../lib/geoPackage')
  , FeatureColumn = require('../../lib/features/user/featureColumn')
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
      Verification.verifyGeometryColumns(geopackage, function(err) {
        if (err) return done(err);
        Verification.verifyTableExists(geopackage, tableName, function(err) {
          if (err) return done(err);
          Verification.verifyContentsForTable(geopackage, tableName, function(err) {
            if (err) return done(err);
            Verification.verifyGeometryColumnsForTable(geopackage, tableName, function(err) {
              if (err) return done(err);
              done();
            });
          });
        });
      });
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

    geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
      var reader = new UserTableReader(tableName);
      reader.readTable(geopackage.connection, function(err, result) {
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

          geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
            Verification.verifyGeometryColumns(geopackage, function(err) {
              if (err) return done(err);
              Verification.verifyTableExists(geopackage, tableName, function(err) {
                if (err) return done(err);
                Verification.verifyContentsForTable(geopackage, tableName, function(err) {
                  if (err) return done(err);
                  Verification.verifyGeometryColumnsForTable(geopackage, tableName, function(err) {
                    if (err) return done(err);
                    done();
                  });
                });
              });
            });
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

        featureDao.create(featureRow, function(err, result) {
          featureDao.getCount(function(err, count) {
            count.should.be.equal(1);
            featureDao.queryForAll(function(err, rows) {
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
              done();
            });
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
              featureDao.queryForAll(function(err, rows) {
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
      });

      it('should delete the feature', function(done) {
        featureDao.getCount(function(err, count) {
          count.should.be.equal(1);

          featureDao.queryForAll(function(err, rows) {
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

});
