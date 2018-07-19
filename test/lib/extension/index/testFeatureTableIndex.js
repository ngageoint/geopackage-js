var GeoPackageAPI = require('../../../..')
  , GeoPackage = require('../../../../lib/geoPackage')
  , FeatureTableIndex = require('../../../../lib/extension/index/featureTableIndex')
  , sqliteQueryBuilder = require('../../../../lib/db/sqliteQueryBuilder')
  , Verification = require('../../../fixtures/verification')
  , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , fs = require('fs')
  , path = require('path')
  , async = require('async');

describe('GeoPackage Feature Table Index Extension tests', function() {

  describe('Create new index', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    var filename;

    function copyGeopackage(orignal, copy, callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        var fsExtra = require('fs-extra');
        fsExtra.copy(originalFilename, filename, callback);
      } else {
        filename = originalFilename;
        callback();
      }
    }

    beforeEach('should open the geopackage', function(done) {
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('FEATURESriversds')
          .then(function(riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should return the index status of false', function() {
      var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
      return fti.isIndexed()
      .then(function(indexed){
        indexed.should.be.equal(false);
      });
    });

    it('should index the table', function() {
      this.timeout(10000);
      var fti = featureDao.featureTableIndex;
      var tableIndex = fti.getTableIndex();
      should.not.exist(tableIndex);
      return fti.index()
      .then(function(indexed) {
        indexed.should.be.equal(true);
        // ensure it was created
        var fti2 = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
        tableIndex = fti2.getTableIndex();
        should.exist(tableIndex);
        should.exist(tableIndex.last_indexed);
      })
      .then(function() {
        fti.hasExtension(fti.extensionName, fti.tableName, fti.columnName)
        .then(function(exists) {
          exists.should.be.equal(true);
        });
      })
      .then(function() {
        var extensionDao = fti.extensionsDao;
        return extensionDao.queryByExtension(fti.extensionName)
        .then(function(extension) {
          extension.getAuthor().should.be.equal('nga');
          extension.getExtensionNameNoAuthor().should.be.equal('geometry_index');
          extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
          extension.column_name.should.be.equal('geom');
          extension.table_name.should.be.equal('FEATURESriversds');
          extension.scope.should.be.equal('read-write');
          extension.extension_name.should.be.equal('nga_geometry_index');
        });
      })
      .then(function() {
        var extensionDao = fti.extensionsDao;
        return extensionDao.queryByExtensionAndTableName(fti.extensionName, fti.tableName)
        .then(function(extensions) {
          var extension = extensions[0];
          extension.getAuthor().should.be.equal('nga');
          extension.getExtensionNameNoAuthor().should.be.equal('geometry_index');
          extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
          extension.column_name.should.be.equal('geom');
          extension.table_name.should.be.equal('FEATURESriversds');
          extension.scope.should.be.equal('read-write');
          extension.extension_name.should.be.equal('nga_geometry_index');
        });
      })
      .then(function() {
        var extensionDao = fti.extensionsDao;
        return extensionDao.queryByExtensionAndTableNameAndColumnName(fti.extensionName, fti.tableName, fti.columnName)
        .then(function(extensions) {
          var extension = extensions[0];
          extension.getAuthor().should.be.equal('nga');
          extension.getExtensionNameNoAuthor().should.be.equal('geometry_index');
          extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
          extension.column_name.should.be.equal('geom');
          extension.table_name.should.be.equal('FEATURESriversds');
          extension.scope.should.be.equal('read-write');
          extension.extension_name.should.be.equal('nga_geometry_index');
        });
      });
    });

    it('should index the table from the geopackage object', function() {
      this.timeout(10000);
      return geoPackage.indexFeatureTable('FEATURESriversds')
      .then(function(indexed) {
        indexed.should.be.equal(true);
        // ensure it was created
        var fti = featureDao.featureTableIndex;
        var tableIndex = fti.getTableIndex();
        should.exist(tableIndex);
        should.exist(tableIndex.last_indexed);
      });
    });

    it('should index the geopackage from the geopackage object', function() {
      this.timeout(10000);
      return geoPackage.index()
      .then(function(status) {
        status.should.be.equal(true);
        // ensure it was created
        var fti = featureDao.featureTableIndex;
        var tableIndex = fti.getTableIndex();
        should.exist(tableIndex);
        should.exist(tableIndex.last_indexed);
      });
    });
  });

  describe('Test existing index', function() {

    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
    var filename;

    function copyGeopackage(orignal, copy, callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        var fsExtra = require('fs-extra');
        fsExtra.copy(originalFilename, filename, callback);
      } else {
        filename = originalFilename;
        callback();
      }
    }

    beforeEach('should open the geopackage', function(done) {
      filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', testSetup.createTempName());
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('rivers')
          .then(function(riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      testSetup.deleteGeoPackage(filename, done);
    });

    it('should query for the index row rivers, 315', function(done) {
      var whereString = 'table_name = ? and geom_id = ?';
      var whereArgs = [ 'rivers', 315 ];

      var query = sqliteQueryBuilder.buildQuery(false, "'nga_geometry_index'", undefined, whereString);
      var result = geoPackage.getDatabase().get(query, whereArgs);
      should.exist(result);
      done();
    });

    it('should get the extension row', function() {
      var fti = featureDao.featureTableIndex;
      return fti.getFeatureTableIndexExtension()
      .then(function(extension){
        should.exist(extension);
      });
    });

    it('should return the index status of true', function() {
      var fti = featureDao.featureTableIndex;
      return fti.isIndexed()
      .then(function(indexed){
        indexed.should.be.equal(true);
      });
    });

    it('should force index the table', function() {
      this.timeout(30000);
      var fti = featureDao.featureTableIndex;
      var tableIndex = fti.getTableIndex();
      tableIndex.last_indexed.should.be.equal('2016-05-02T12:08:14.144Z');
      return fti.indexWithForce(true)
      .then(function(indexed) {
        indexed.should.be.equal(true);
        // ensure it was created
        var fti2 = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
        tableIndex = fti2.getTableIndex();
        should.exist(tableIndex);
        tableIndex.last_indexed.should.not.be.equal('2016-05-02T12:08:14.144Z');
      });
    });
  });
});
