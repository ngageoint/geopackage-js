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

describe.skip('GeoPackage Feature Table Index Extension tests', function() {

  describe('Create new index', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'rivers.gpkg');

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
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('FEATURESriversds', function(err, riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(filename, done);
      } else {
        done();
      }
    });

    it('should return the index status of false', function(done) {
      var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
      fti.isIndexed(function(err, indexed){
        should.not.exist(err);
        indexed.should.be.equal(false);
        done();
      });
    });

    it('should index the table', function(done) {
      this.timeout(10000);
      var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
      fti.getTableIndex(function(err, tableIndex) {
        should.not.exist(tableIndex);
        should.not.exist(err);
        fti.index(function() {
          console.log('progress', arguments);
        }, function(err) {
          should.not.exist(err);
          // ensure it was created
          var fti2 = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
          fti2.getTableIndex(function(err, tableIndex) {
            should.exist(tableIndex);
            should.not.exist(err);
            should.exist(tableIndex.last_indexed);
            done();
          });
        });
      });
    });

    it('should index the table from the GeoPackageAPI', function(done) {
      this.timeout(10000);
      GeoPackageAPI.indexFeatureTable(geoPackage, 'FEATURESriversds', function(err, status) {
        should.not.exist(err);
        status.should.be.equal(true);
        // ensure it was created
        var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
        fti.getTableIndex(function(err, tableIndex) {
          should.exist(tableIndex);
          should.not.exist(err);
          should.exist(tableIndex.last_indexed);
          done();
        });
      });
    });

    it('should index the geopackage from the GeoPackageAPI', function(done) {
      this.timeout(10000);
      GeoPackageAPI.indexGeoPackage(geoPackage, function(err, status) {
        should.not.exist(err);
        status.should.be.equal(true);
        // ensure it was created
        var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
        fti.getTableIndex(function(err, tableIndex) {
          should.exist(tableIndex);
          should.not.exist(err);
          should.exist(tableIndex.last_indexed);
          done();
        });
      });
    });
  });

  describe('Test existing index', function() {

    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
    var filename = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp', 'rivers_indexed.gpkg');

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
      copyGeopackage(originalFilename, filename, function(err) {
        GeoPackageAPI.open(filename, function(err, gp) {
          geoPackage = gp;
          should.not.exist(err);
          should.exist(gp);
          should.exist(gp.getDatabase().getDBConnection());
          gp.getPath().should.be.equal(filename);
          geoPackage.getFeatureDaoWithTableName('rivers', function(err, riverFeatureDao) {
            featureDao = riverFeatureDao;
            done();
          });
        });
      });
    });

    afterEach('should close the geopackage', function(done) {
      geoPackage.close();
      if (typeof(process) !== 'undefined' && process.version) {
        fs.unlink(filename, done);
      } else {
        done();
      }
    });

    it('should query for the index row rivers, 315', function(done) {
      var whereString = 'table_name = ? and geom_id = ?';
      var whereArgs = [ 'rivers', 315 ];

      var query = sqliteQueryBuilder.buildQuery(false, "'nga_geometry_index'", undefined, whereString);
      geoPackage.getDatabase().get(query, whereArgs, function(err, result) {
        should.exist(result);
        done(err);
      }.bind(this));
    });

    it('should get the extension row', function(done) {
      var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
      fti.getFeatureTableIndexExtension(function(err, extension){
        should.not.exist(err);
        should.exist(extension);
        done();
      });
    });

    it('should return the index status of true', function(done) {
      var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
      fti.isIndexed(function(err, indexed){
        should.not.exist(err);
        indexed.should.be.equal(true);
        done();
      });
    });

    it('should force index the table', function(done) {
      this.timeout(30000);
      var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
      fti.getTableIndex(function(err, tableIndex) {
        tableIndex.last_indexed.should.be.equal('2016-05-02T12:08:14.144Z');
        fti.indexWithForce(true, function() {
        }, function(err) {
          should.not.exist(err);
          // ensure it was created
          var fti2 = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
          fti2.getTableIndex(function(err, tableIndex) {
            should.exist(tableIndex);
            should.not.exist(err);
            tableIndex.last_indexed.should.not.be.equal('2016-05-02T12:08:14.144Z');
            done();
          });
        });
      });
    });
  });
});
