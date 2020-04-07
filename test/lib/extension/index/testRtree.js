import { GeoPackageAPI } from '../../../..'
import { default as testSetup } from '../../../fixtures/testSetup'
import {RTreeIndex} from '../../../../lib/extension/rtree/rtreeIndex'
import {FeatureTableIndex} from '../../../../lib/extension/index/featureTableIndex'
import {RTreeIndexDao} from '../../../../lib/extension/rtree/rtreeIndexDao'

var BoundingBox = require('../../../../lib/boundingBox').BoundingBox
  // , testSetup = require('../../../fixtures/testSetup')
  , should = require('chai').should()
  , path = require('path');

describe('RTree tests', function() {

  describe('Test Existing RTree', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'super.gpkg');
    var filename;

    beforeEach('should open the geopackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geopackage;
      featureDao = geoPackage.getFeatureDao('line1');
    });

    afterEach('should close the geopackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return the index status of true', function() {
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var indexed = fti.isIndexed();
      fti.rtreeIndexed.should.be.equal(true);
      indexed.should.be.equal(true);
      var exists = fti.hasExtension(RTreeIndexDao.EXTENSION_NAME, fti.tableName, fti.columnName);
      exists.should.be.equal(true);

      var extensionDao = fti.extensionsDao;
      var extensions = extensionDao.queryByExtensionAndTableNameAndColumnName(RTreeIndexDao.EXTENSION_NAME, fti.tableName, fti.columnName);
      var extension = extensions[0];
      extension.author.should.be.equal('gpkg');
      extension.extensionNameNoAuthor.should.be.equal('rtree_index');
      extension.definition.should.be.equal('http://www.geopackage.org/spec/#extension_rtree');
      extension.column_name.should.be.equal('geometry');
      extension.table_name.should.be.equal('line1');
      extension.scope.should.be.equal('write-only');
      extension.extension_name.should.be.equal('gpkg_rtree_index');

    });

    it('should query the index from the geopackage api', function() {
      return geoPackage.getGeoJSONFeaturesInTile('line1', 0, 0, 0)
        .then(function(features) {
          features.length.should.be.equal(1);
        });
    });

    it('should query the index with a geometry envelope', function() {
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var bb = new BoundingBox(-105, -103, 39, 40);
      var envelope = bb.buildEnvelope();
      var iterator = fti.queryWithGeometryEnvelope(envelope);
      var count = 0;
      for (var feature of iterator) {
        count++;
      }
      count.should.be.equal(1);
    });

    it('should query the index with a geometry envelope around the 180 line', function() {
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var bb = new BoundingBox(-103, -105, 39, 40);
      var envelope = bb.buildEnvelope();
      var iterator = fti.queryWithGeometryEnvelope(envelope);
      var count = 0;
      for (var feature of iterator) {
        count++;
      }
      count.should.be.equal(0);
    });

    it('should query the index with a geometry envelope around the 180 line and find something', function() {
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var bb = new BoundingBox(-178, -179, 39, 40);
      var envelope = bb.buildEnvelope();
      var iterator = fti.queryWithGeometryEnvelope(envelope);
      var count = 0;
      for (var feature of iterator) {
        count++;
      }
      count.should.be.equal(1);
    });
  });

  describe('Test adding RTree to existing GeoPackage', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers.gpkg');
    var filename;

    beforeEach('should open the geopackage', async function() {
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

    it('should add the RTree extension to the GeoPackage', function() {
      var rtreeIndex = new RTreeIndex(geoPackage, featureDao);
      return rtreeIndex.create()
        .then(function(extension) {
          var fti = new FeatureTableIndex(geoPackage, featureDao);
          var indexed = fti.isIndexed();
          indexed.should.be.equal(true);
        })
        .then(function() {
          var exists = rtreeIndex.hasExtension(rtreeIndex.extensionName, rtreeIndex.tableName, rtreeIndex.columnName);
          exists.should.be.equal(true);
        })
        .then(function() {
          var extensionDao = rtreeIndex.extensionsDao;
          var extension = extensionDao.queryByExtension(rtreeIndex.extensionName);
          extension.author.should.be.equal('gpkg');
          extension.extensionNameNoAuthor.should.be.equal('rtree_index');
          extension.definition.should.be.equal('http://www.geopackage.org/spec/#extension_rtree');
          extension.column_name.should.be.equal('geom');
          extension.table_name.should.be.equal('FEATURESriversds');
          extension.scope.should.be.equal('write-only');
          extension.extension_name.should.be.equal('gpkg_rtree_index');
        });
    });
  });
});
