var testSetup = require('../../../../testSetup').default,
  BoundingBox = require('../../../../../lib/boundingBox').BoundingBox,
  assert = require('chai').assert,
  { ProjectionConstants, Projections, ProjectionTransform } = require('@ngageoint/projections-js'),
  { RTreeIndexExtension } = require('../../../../../lib/extension/rtree/rTreeIndexExtension'),
  { ExtensionScopeType } = require('../../../../../lib/extension/extensionScopeType'),
  { FeatureIndexManager } = require('../../../../../lib/features/index/featureIndexManager'),
  path = require('path');

describe('RTree tests', function () {
  describe('Test Existing RTree', function () {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'import_db.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function () {
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should test rtree index extension', function () {
      const extension = new RTreeIndexExtension(geoPackage);

      const featureTables = geoPackage.getFeatureTables();
      for (const featureTable of featureTables) {
        const featureDao = geoPackage.getFeatureDao(featureTable);
        const table = featureDao.getTable();

        if (!extension.hasExtensionWithFeatureTable(table)) {
          const createdExtension = extension.createWithFeatureTable(table);
          assert.isNotNull(createdExtension);
        }

        const tableDao = extension.getTableDao(featureDao);
        assert.isTrue(tableDao.has());
        featureDao.count().should.be.equal(tableDao.count());

        let totalEnvelope = null;

        let expectedCount = 0;

        let resultSet = tableDao.queryForAll();
        while (resultSet.moveToNext()) {
          let row = tableDao.getRowWithUserCustomResultSet(resultSet);
          assert.isNotNull(row);

          let featureRow = tableDao.getFeatureRow(row);
          assert.isNotNull(featureRow);

          row.getId().should.be.equal(featureRow.getId());

          let minX = row.getMinX();
          let maxX = row.getMaxX();
          let minY = row.getMinY();
          let maxY = row.getMaxY();

          let envelope = featureRow.getGeometryEnvelope();

          if (envelope != null) {
            assert.isTrue(envelope.minX >= minX);
            assert.isTrue(envelope.maxX <= maxX);
            assert.isTrue(envelope.minY >= minY);
            assert.isTrue(envelope.maxY <= maxY);

            let results = tableDao.queryWithGeometryEnvelope(envelope);
            assert.isTrue(results.getCount() > 0);
            let found = false;
            while (results.moveToNext()) {
              let queryFeatureRow = tableDao.getFeatureRowWithUserCustomRow(results.getRow());
              if (queryFeatureRow.getId() === featureRow.getId()) {
                found = true;
                break;
              }
            }
            assert.isTrue(found);
            results.close();

            expectedCount++;
            if (totalEnvelope == null) {
              totalEnvelope = envelope;
            } else {
              totalEnvelope = totalEnvelope.union(envelope);
            }
          }
        }
        resultSet.close();

        if (totalEnvelope != null) {
          let envelopeCount = tableDao.countWithGeometryEnvelope(totalEnvelope);
          assert.isTrue(envelopeCount >= expectedCount);
          let results = tableDao.queryWithGeometryEnvelope(totalEnvelope);
          envelopeCount.should.be.equal(results.getCount());
          results.close();

          let boundingBox = new BoundingBox(
            totalEnvelope.minX,
            totalEnvelope.minY,
            totalEnvelope.maxX,
            totalEnvelope.maxY,
          );
          let bboxCount = tableDao.countWithBoundingBoxAndProjection(boundingBox);
          assert.isTrue(bboxCount >= expectedCount);
          results = tableDao.queryWithBoundingBoxAndProjection(boundingBox);
          bboxCount.should.be.equal(results.getCount());
          results.close();
          envelopeCount.should.be.equal(bboxCount);

          let projection = featureDao.getProjection();
          if (projection.getAuthority() !== ProjectionConstants.AUTHORITY_NONE) {
            let queryProjection = null;
            if (projection.equals(ProjectionConstants.AUTHORITY_EPSG, ProjectionConstants.EPSG_WEB_MERCATOR)) {
              queryProjection = Projections.getWGS84Projection();
            } else {
              queryProjection = Projections.getWebMercatorProjection();
            }
            let transform = new ProjectionTransform(projection, queryProjection);
            let projectedBoundingBox = boundingBox.transform(transform);
            let projectedBboxCount = tableDao.countWithBoundingBoxAndProjection(
              projectedBoundingBox,
              queryProjection,
            );
            assert.isTrue(projectedBboxCount >= expectedCount);
            results = tableDao.queryWithBoundingBoxAndProjection(projectedBoundingBox, queryProjection);
            projectedBboxCount.should.be.equal(results.getCount());
            results.close();
            assert.isTrue(projectedBboxCount >= expectedCount);
          }
        }
      }
    });
  });

  describe('Test adding RTree to existing GeoPackage', function () {
    var geoPackage;
    var featureDao;

    var originalFilename = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'rivers.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function () {
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
      featureDao = geoPackage.getFeatureDao('FEATURESriversds');
    });

    afterEach('should close the geoPackage', async function () {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should add the RTree extension to the GeoPackage', function () {
      try {
        const rtreeIndex = new RTreeIndexExtension(geoPackage);
        let extension = rtreeIndex.createWithFeatureTable(featureDao.getTable());
        const featureIndexManager = new FeatureIndexManager(geoPackage, featureDao);
        const indexed = featureIndexManager.isIndexed();
        indexed.should.be.equal(true);
        const exists = rtreeIndex.hasExtensionWithTable('FEATURESriversds');
        exists.should.be.equal(true);
        const extensionDao = geoPackage.getExtensionsDao();
        extensionDao.queryByExtension(rtreeIndex.extensionName);
        extension.getAuthor().should.be.equal('gpkg');
        extension.getExtensionNameNoAuthor().should.be.equal('rtree_index');
        extension.getDefinition().should.be.equal('http://www.geopackage.org/spec/#extension_rtree');
        extension.getColumnName().should.be.equal('geom');
        extension.getTableName().should.be.equal('FEATURESriversds');
        extension.getScope().should.be.equal(ExtensionScopeType.WRITE_ONLY);
        extension.getExtensionName().should.be.equal('gpkg_rtree_index');
      } catch (e) {
        console.error(e);
      }
    });
  });
});
