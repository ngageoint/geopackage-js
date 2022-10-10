import { default as testSetup } from '../../../testSetup'
import { RTreeIndexExtension } from '../../../../lib/extension/rtree/rTreeIndexExtension'
import {FeatureTableIndex} from '../../../../lib/extension/nga/index/featureTableIndex'
import {RTreeIndexTableDao} from '../../../../lib/extension/rtree/rTreeIndexTableDao'

var BoundingBox = require('../../../../lib/boundingBox').BoundingBox
  , should = require('chai').should()
  , path = require('path');

describe('RTree tests', function() {

  describe('Test Existing RTree', function() {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'super.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('line1');
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should return the index status of true', function() {
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var indexed = fti.isIndexed();
      fti.rtreeIndexed.should.be.equal(true);
      indexed.should.be.equal(true);
      var exists = fti.hasExtension(RTreeIndexTableDao.EXTENSION_NAME, fti.tableName, fti.columnName);
      exists.should.be.equal(true);

      var extensionDao = fti.extensionsDao;
      var extensions = extensionDao.queryByExtensionAndTableNameAndColumnName(RTreeIndexTableDao.EXTENSION_NAME, fti.tableName, fti.columnName);
      var extension = extensions[0];
      extension.getAuthor().should.be.equal('gpkg');
      extension.getExtensionNameNoAuthor().should.be.equal('rtree_index');
      extension.getDefinition().should.be.equal('http://www.geoPackage.org/spec/#extension_rtree');
      extension.getColumnName().should.be.equal('geometry');
      extension.getTableName().should.be.equal('line1');
      extension.getScope().should.be.equal('write-only');
      extension.getExtensionName().should.be.equal('gpkg_rtree_index');

    });

    it('should query the index from the geoPackage api', function() {
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

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('FEATURESriversds');
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should add the RTree extension to the GeoPackage', function() {
      var rtreeIndex = new RTreeIndexExtension(geoPackage);
      let extension = rtreeIndex.createWithFeatureTable(featureDao.getTable());
      var fti = new FeatureTableIndex(geoPackage, featureDao);
      var indexed = fti.isIndexed();
      indexed.should.be.equal(true);
      var exists = rtreeIndex.hasExtension(rtreeIndex.extensionName, rtreeIndex.tableName, rtreeIndex.columnName);
      exists.should.be.equal(true);
      var extensionDao = rtreeIndex.extensionsDao;
      extensionDao.queryByExtension(rtreeIndex.extensionName);
      extension.getAuthor().should.be.equal('gpkg');
      extension.getExtensionNameNoAuthor().should.be.equal('rtree_index');
      extension.getDefinition().should.be.equal('http://www.geoPackage.org/spec/#extension_rtree');
      extension.getColumnName().should.be.equal('geom');
      extension.getTableName().should.be.equal('FEATURESriversds');
      extension.getScope().should.be.equal('write-only');
      extension.getExtensionName().should.be.equal('gpkg_rtree_index');
    });
  });
});
