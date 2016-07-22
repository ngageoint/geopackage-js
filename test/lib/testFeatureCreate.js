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
  , should = require('chai').should()
  , wkx = require('wkx')
  , path = require('path')
  , async = require('async')
  , fs = require('fs');

describe('GeoPackage Feature table create tests', function() {

  var testGeoPackage = path.join('/tmp', 'test.gpkg');
  var geopackage;

  beforeEach(function(done) {
    fs.unlink(testGeoPackage, function() {
      fs.closeSync(fs.openSync(testGeoPackage, 'w'));
      GeoPackageConnection.connect(testGeoPackage, function(err, connection) {
        geopackage = new GeoPackage(path.basename(testGeoPackage), testGeoPackage, connection);
        var tc = new TableCreator(geopackage);
        tc.createRequired(done);
      });
    });
  });

  it('should create a feature table', function(done) {
    var geometryColumns = SetupFeatureTable.buildGeometryColumns('test_features', 'geom', wkx.Types.wkt.Point);
    var boundingBox = new BoundingBox(-180, 180, -80, 80);

    var columns = [];

    columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
    columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
    columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkx.Types.wkt.Point, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
    columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
    columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

    geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
      Verification.verifyGeometryColumns(geopackage, function(err) {
        if (err) return done(err);
        Verification.verifyTableExists(geopackage, 'test_features', function(err) {
          if (err) return done(err);
          Verification.verifyContentsForTable(geopackage, 'test_features', function(err) {
            if (err) return done(err);
            Verification.verifyGeometryColumnsForTable(geopackage, 'test_features', function(err) {
              if (err) return done(err);
              done();
            });
          });
        });
      });
    });
  });

  describe('GeoPackage feature create features tests', function(done) {
    beforeEach(function(done) {
      fs.unlink(testGeoPackage, function() {
        fs.closeSync(fs.openSync(testGeoPackage, 'w'));
        GeoPackageConnection.connect(testGeoPackage, function(err, connection) {
          geopackage = new GeoPackage(path.basename(testGeoPackage), testGeoPackage, connection);
          var tc = new TableCreator(geopackage);
          tc.createRequired(function(err) {

            var geometryColumns = SetupFeatureTable.buildGeometryColumns('test_features', 'geom', wkx.Types.wkt.Point);
            var boundingBox = new BoundingBox(-180, 180, -80, 80);

            var columns = [];

            columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
            columns.push(FeatureColumn.createColumnWithIndexAndMax(7, 'test_text_limited', DataTypes.GPKGDataType.GPKG_DT_TEXT, 5, false, null));
            columns.push(FeatureColumn.createColumnWithIndexAndMax(8, 'test_blob_limited', DataTypes.GPKGDataType.GPKG_DT_BLOB, 7, false, null));
            columns.push(FeatureColumn.createGeometryColumn(1, 'geom', wkx.Types.wkt.Point, false, null));
            columns.push(FeatureColumn.createColumnWithIndex(2, 'test_text', DataTypes.GPKGDataType.GPKG_DT_TEXT, false, ""));
            columns.push(FeatureColumn.createColumnWithIndex(3, 'test_real', DataTypes.GPKGDataType.GPKG_DT_REAL, false, null));
            columns.push(FeatureColumn.createColumnWithIndex(4, 'test_boolean', DataTypes.GPKGDataType.GPKG_DT_BOOLEAN, false, null));
            columns.push(FeatureColumn.createColumnWithIndex(5, 'test_blob', DataTypes.GPKGDataType.GPKG_DT_BLOB, false, null));
            columns.push(FeatureColumn.createColumnWithIndex(6, 'test_integer', DataTypes.GPKGDataType.GPKG_DT_INTEGER, false, ""));

            geopackage.createFeatureTableWithGeometryColumns(geometryColumns, boundingBox, 4326, columns, function(err, result) {
              Verification.verifyGeometryColumns(geopackage, function(err) {
                if (err) return done(err);
                Verification.verifyTableExists(geopackage, 'test_features', function(err) {
                  if (err) return done(err);
                  Verification.verifyContentsForTable(geopackage, 'test_features', function(err) {
                    if (err) return done(err);
                    Verification.verifyGeometryColumnsForTable(geopackage, 'test_features', function(err) {
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
    });

    it('should create a feature', function(done) {
      geopackage.getFeatureDaoWithTableName('test_features', function(err, featureDao) {
        console.log('featureDao', featureDao);
        var featureRow = featureDao.newRow();
        var geometryData = new GeometryData();
        geometryData.setSrsId(4326);
        featureRow.setGeometry('doop');
        console.log('featureRow', featureRow);
        done();
      });
    });
  });

});
