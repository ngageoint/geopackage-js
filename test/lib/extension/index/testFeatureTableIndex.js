import { GeoPackage as GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import {FeatureTableIndex} from '../../../../lib/extension/index/featureTableIndex';


var GeoPackage = require('../../../../lib/geoPackage')
  , sqliteQueryBuilder = require('../../../../lib/db/sqliteQueryBuilder').SqliteQueryBuilder
  , Verification = require('../../../fixtures/verification')
  // , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , fs = require('fs-extra')
  , path = require('path');

describe('GeoPackage Feature Table Index Extension tests', function() {

  describe('Create new index', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    var filename;

    beforeEach('create the GeoPackage connection', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('FEATURESriversds');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return the index status of false', function() {
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var indexed = fti.isIndexed();
      indexed.should.be.equal(false);
    });

    it('should check the index extension', function() {
      this.timeout(10000);
      var fti = featureDao.featureTableIndex;
      var tableIndex = fti.getTableIndex();
      should.not.exist(tableIndex);
      return fti.index(function(message) {
        console.log('message', message);
      })
      .then(function(indexed) {
        console.log('indexed', indexed);
        indexed.should.be.equal(true);
        // ensure it was created
        var fti2 = new FeatureTableIndex(geoPackage, featureDao);
        tableIndex = fti2.getTableIndex();
        should.exist(tableIndex);
        should.exist(tableIndex.last_indexed);
      })
      .then(function() {
        var exists = fti.hasExtension(fti.extensionName, fti.tableName, fti.columnName)
        exists.should.be.equal(true);
      })
      .then(function() {
        var extensionDao = fti.extensionsDao;
        var extension = extensionDao.queryByExtension(fti.extensionName);
        extension.author.should.be.equal('nga');
        extension.extensionNameNoAuthor.should.be.equal('geometry_index');
        extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
        extension.column_name.should.be.equal('geom');
        extension.table_name.should.be.equal('FEATURESriversds');
        extension.scope.should.be.equal('read-write');
        extension.extension_name.should.be.equal('nga_geometry_index');
      })
      .then(function() {
        var extensionDao = fti.extensionsDao;
        var extensions = extensionDao.queryByExtensionAndTableName(fti.extensionName, fti.tableName);
        var extension = extensions[0];
        extension.author.should.be.equal('nga');
        extension.extensionNameNoAuthor.should.be.equal('geometry_index');
        extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
        extension.column_name.should.be.equal('geom');
        extension.table_name.should.be.equal('FEATURESriversds');
        extension.scope.should.be.equal('read-write');
        extension.extension_name.should.be.equal('nga_geometry_index');
      })
      .then(function() {
        var extensionDao = fti.extensionsDao;
        var extensions = extensionDao.queryByExtensionAndTableNameAndColumnName(fti.extensionName, fti.tableName, fti.columnName);
        var extension = extensions[0];
        extension.author.should.be.equal('nga');
        extension.extensionNameNoAuthor.should.be.equal('geometry_index');
        extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
        extension.column_name.should.be.equal('geom');
        extension.table_name.should.be.equal('FEATURESriversds');
        extension.scope.should.be.equal('read-write');
        extension.extension_name.should.be.equal('nga_geometry_index');
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

    beforeEach('should open the geopackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('rivers');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should query for the index row rivers, 315', function(done) {
      var whereString = 'table_name = ? and geom_id = ?';
      var whereArgs = [ 'rivers', 315 ];

      var query = sqliteQueryBuilder.buildQuery(false, "'nga_geometry_index'", undefined, whereString);
      var result = geoPackage.database.get(query, whereArgs);
      should.exist(result);
      done();
    });

    it('should get the extension row', function() {
      var fti = featureDao.featureTableIndex;
      var extension = fti.getFeatureTableIndexExtension();
      should.exist(extension);
    });

    it('should return the index status of true', function() {
      var fti = featureDao.featureTableIndex;
      var indexed = fti.isIndexed();
      indexed.should.be.equal(true);
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
        var fti2 = new FeatureTableIndex(geoPackage, featureDao);
        tableIndex = fti2.getTableIndex();
        should.exist(tableIndex);
        tableIndex.last_indexed.should.not.be.equal('2016-05-02T12:08:14.144Z');
      });
    });
  });
});
