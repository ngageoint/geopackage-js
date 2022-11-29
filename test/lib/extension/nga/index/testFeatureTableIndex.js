import { default as testSetup } from '../../../../testSetup'
import { TestGeoPackageProgress } from "../../../io/testGeoPackageProgress";
import { BoundingBox } from "../../../../../lib/boundingBox";
import { ProjectionConstants, Projections } from "@ngageoint/projections-js";
import { GeometryTransform } from "@ngageoint/simple-features-proj-js";
import { Point } from "@ngageoint/simple-features-js";
import { GeoPackageGeometryData } from "../../../../../lib/geom/geoPackageGeometryData";
import { ExtensionScopeType } from "../../../../../lib/extension/extensionScopeType";

var FeatureTableIndex = require('../../../../../lib/extension/nga/index/featureTableIndex').FeatureTableIndex
  , assert = require('chai').assert
  , path = require('path');

describe('GeoPackage Feature Table Index Extension tests', function() {

  describe('Create new index', function() {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'import_db.gpkg');
    var filename;

    beforeEach('create the GeoPackage connection', async function() {
      try {
        // @ts-ignore
        let result = await copyAndOpenGeopackage(originalFilename);
        filename = result.path;
        geoPackage = result.geoPackage;
      } catch (e) {
        console.error(e);
      }
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('test create', function() {
      function validateGeometryIndex (featureTableIndex, geometryIndex) {
        const featureRow = featureTableIndex.getFeatureRow(geometryIndex);
        assert.exists(featureRow);
        assert.equal(featureTableIndex.getTableName(), geometryIndex.getTableName());
        assert.equal(geometryIndex.getGeomId(), featureRow.getId());
        const envelope = featureRow.getGeometryEnvelope();
        assert.exists(envelope);
        assert.equal(envelope.minX, geometryIndex.getMinX());
        assert.equal(envelope.maxX, geometryIndex.getMaxX());
        assert.equal(envelope.minY, geometryIndex.getMinY());
        assert.equal(envelope.maxY, geometryIndex.getMaxY());
        if (envelope.hasZ) {
          assert.equal(envelope.minZ, geometryIndex.getMinZ());
          assert.equal(envelope.maxZ, geometryIndex.getMaxZ());
        } else {
          assert.notExists(geometryIndex.getMinZ());
          assert.notExists(geometryIndex.getMaxZ());
        }
        if (envelope.hasM) {
          assert.equal(envelope.minM, geometryIndex.getMinM());
          assert.equal(envelope.maxM, geometryIndex.getMaxM());
        } else {
          assert.notExists(geometryIndex.getMinM());
          assert.notExists(geometryIndex.getMaxM());
        }
      }

      // Test indexing each feature table
      const featureTables = geoPackage.getFeatureTables();
      for (const featureTable of featureTables) {
        const featureDao = geoPackage.getFeatureDao(featureTable);
        const featureTableIndex = new FeatureTableIndex(geoPackage, featureDao);
        // Determine how many features have geometry envelopes or geometries
        let expectedCount = 0;
        let testFeatureRow = null;
        let featureResultSet = featureDao.query();
        const count = featureResultSet.getCount();
        while (featureResultSet.moveToNext()) {
          let featureRow = featureResultSet.getRow();
          if (featureRow.getGeometryEnvelope() != null) {
            expectedCount++;
            // Randomly choose a feature row with Geometry for testing queries later
            if (testFeatureRow == null) {
              testFeatureRow = featureRow;
            } else if (Math.random() < (1.0 / count)) {
              testFeatureRow = featureRow;
            }
          }
        }
        featureResultSet.close();
        featureResultSet = null;

        if (featureTableIndex.isIndexed()) {
          featureTableIndex.deleteIndex();
        }

        assert.isFalse(featureTableIndex.isIndexed());
        assert.notExists(featureTableIndex.getLastIndexed());
        const currentDate = new Date();

        testSetup.validateGeoPackage(geoPackage);

        // Test indexing
        const progress = new TestGeoPackageProgress();
        featureTableIndex.setProgress(progress);
        const indexCount = featureTableIndex.index();
        testSetup.validateGeoPackage(geoPackage);

        expectedCount.should.be.equal(indexCount);
        assert.equal(expectedCount, indexCount);
        assert.equal(featureDao.count(), progress.getProgress());
        assert.exists(featureTableIndex.getLastIndexed());
        const lastIndexed = featureTableIndex.getLastIndexed();
        assert.isTrue(lastIndexed.getTime() > currentDate.getTime());

        assert.isTrue(featureTableIndex.isIndexed());
        assert.equal(expectedCount, featureTableIndex.count());

        // Test re-indexing, both ignored and forced
        assert.equal(0, featureTableIndex.index());
        assert.equal(expectedCount, featureTableIndex.index(true));
        assert.isTrue(featureTableIndex.getLastIndexed().getTime() > lastIndexed.getTime());

        // Query for all indexed geometries
        let resultCount = 0;
        let featureTableResults = featureTableIndex.query();
        for (let geometryIndex of featureTableResults) {
          validateGeometryIndex(featureTableIndex, geometryIndex);
          resultCount++;
        }
        assert.equal(expectedCount, resultCount);

        // Test the query by envelope
        let envelope = testFeatureRow.getGeometryEnvelope();
        envelope.minX = (envelope.minX - .000001);
        envelope.maxX = (envelope.maxX + .000001);
        envelope.minY = (envelope.minY - .000001);
        envelope.maxY = (envelope.maxY + .000001);
        if (envelope.hasZ) {
          envelope.minZ = (envelope.minZ - .000001);
          envelope.maxZ = (envelope.maxZ + .000001);
        }
        if (envelope.hasM) {
          envelope.minM = (envelope.minM - .000001);
          envelope.maxM = (envelope.maxM + .000001);
        }
        resultCount = 0;
        let featureFound = false;
        assert.isTrue(featureTableIndex.countWithGeometryEnvelope(envelope) >= 1);
        featureTableResults = featureTableIndex.queryWithGeometryEnvelope(envelope);
        for (let geometryIndex of featureTableResults) {
          validateGeometryIndex(featureTableIndex, geometryIndex);
          if (geometryIndex.getGeomId() === testFeatureRow.getId()) {
            featureFound = true;
          }
          resultCount++;
        }
        assert.isTrue(featureFound);
        assert.isTrue(resultCount >= 1);

        // Pick a projection different from the feature dao and project the
        // bounding box
        const boundingBox = new BoundingBox(envelope.minX - 1,
          envelope.minY - 1, envelope.maxX + 1,
          envelope.maxY + 1);
        let projection = null;
        if (!featureDao.getProjection().equals(ProjectionConstants.AUTHORITY_EPSG, ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM)) {
          projection = Projections.getWGS84Projection();
        } else {
          projection = Projections.getWebMercatorProjection();
        }
        let transform = GeometryTransform.create(featureDao.getProjection(), projection);
        let transformedBoundingBox = boundingBox.transform(transform);

        // Test the query by projected bounding box
        resultCount = 0;
        featureFound = false;
        assert.isTrue(featureTableIndex.countWithBoundingBoxAndProjection(transformedBoundingBox, projection) >= 1);
        featureTableResults = featureTableIndex.queryWithBoundingBoxAndProjection(transformedBoundingBox, projection);
        for (const geometryIndex of featureTableResults) {
          validateGeometryIndex(featureTableIndex, geometryIndex);
          if (geometryIndex.getGeomId() === testFeatureRow.getId()) {
            featureFound = true;
          }
          resultCount++;
        }
        assert.isTrue(featureFound);
        assert.isTrue(resultCount >= 1);

        // Update a Geometry and update the index of a single feature row
        const point = new Point(5, 5);
        const geometryData = GeoPackageGeometryData.createWithSrsId(featureDao.getSrsId(), point);
        testFeatureRow.setGeometry(geometryData);
        assert.equal(1, featureDao.update(testFeatureRow));
        const lastIndexedBefore = featureTableIndex.getLastIndexed();
        assert.isTrue(featureTableIndex.indexFeatureRow(testFeatureRow));
        const lastIndexedAfter = featureTableIndex.getLastIndexed();
        assert.isTrue(lastIndexedAfter.getTime() > lastIndexedBefore.getTime());

        // Verify the index was updated for the feature row
        envelope = point.getEnvelope();
        resultCount = 0;
        featureFound = false;
        assert.isTrue(featureTableIndex.countWithGeometryEnvelope(envelope) >= 1);
        featureTableResults = featureTableIndex.queryWithGeometryEnvelope(envelope);
        for (const geometryIndex of featureTableResults) {
          validateGeometryIndex(featureTableIndex, geometryIndex);
          if (geometryIndex.getGeomId() === testFeatureRow.getId()) {
            featureFound = true;
          }
          resultCount++;
        }
        assert.isTrue(featureFound);
        assert.isTrue(resultCount >= 1);
      }

      const extensionsDao = geoPackage.getExtensionsDao();
      const geometryIndexDao = FeatureTableIndex.getGeometryIndexDao(geoPackage);
      const tableIndexDao = FeatureTableIndex.getTableIndexDao(geoPackage);

      // Delete the extensions for the first half of the feature tables
      let everyOther = false;
      for (const featureTable of featureTables.slice(0, Math.ceil(featureTables.length * .5))) {
        const featureDao = geoPackage.getFeatureDao(featureTable);
        let geometryCount = geometryIndexDao.queryForTableName(featureTable).length;
        assert.isTrue(geometryCount > 0);
        assert.exists(tableIndexDao.queryForId(featureTable));
        let extensions = extensionsDao.queryByExtensionAndTableNameAndColumnName(FeatureTableIndex.EXTENSION_NAME, featureTable, featureDao.getGeometryColumnName());
        assert.isTrue(extensions.length > 0);
        const extension = extensions[0];
        assert.exists(extension);
        assert.equal(extension.getTableName(), featureTable);
        assert.equal(extension.getColumnName(), featureDao.getGeometryColumnName());
        assert.equal(extension.getExtensionName(), FeatureTableIndex.EXTENSION_NAME);
        assert.equal(extension.getAuthor(), FeatureTableIndex.EXTENSION_AUTHOR);
        assert.equal(extension.getExtensionNameNoAuthor(), FeatureTableIndex.EXTENSION_NAME_NO_AUTHOR);
        assert.equal(extension.getDefinition(), FeatureTableIndex.EXTENSION_DEFINITION);
        assert.equal(extension.getScope(), ExtensionScopeType.READ_WRITE);
        const featureTableIndex = new FeatureTableIndex(geoPackage, featureDao);
        assert.isTrue(featureTableIndex.isIndexed());
        assert.equal(geometryCount, featureTableIndex.count());

        // Test deleting a single geometry index
        if (everyOther) {
          const featureResultSet = featureDao.queryForAll();
          while (featureResultSet.moveToNext()) {
            const featureRow = featureResultSet.getRow();
            const geometryData = featureRow.getGeometry();
            if (geometryData != null && (geometryData.getEnvelope() != null || geometryData.getGeometry() != null)) {
              featureResultSet.close();
              assert.equal(1, featureTableIndex.deleteIndexWithFeatureRow(featureRow));
              assert.equal(geometryCount - 1, featureTableIndex.count());
              break;
            }
          }
          featureResultSet.close();
        }

        // deleting the table extensions for this feature table
        geoPackage.getExtensionManager().deleteTableExtensions(featureTable);

        assert.isFalse(featureTableIndex.isIndexed());
        assert.equal(0, geometryIndexDao.queryForTableName(featureTable).length);
        assert.notExists(tableIndexDao.queryForId(featureTable));
        extensions = extensionsDao.queryByExtensionAndTableNameAndColumnName(FeatureTableIndex.EXTENSION_NAME, featureTable, featureDao.getGeometryColumnName());
        assert.isTrue(extensions.length === 0);
        everyOther = !everyOther;
      }

      assert.isTrue(geometryIndexDao.isTableExists());
      assert.isTrue(tableIndexDao.isTableExists());
      assert.isTrue(extensionsDao.queryAllByExtension(FeatureTableIndex.EXTENSION_NAME).length > 0);

      // Test deleting all NGA extensions
      geoPackage.getExtensionManager().deleteExtensions();

      assert.isFalse(geometryIndexDao.isTableExists());
      assert.isFalse(tableIndexDao.isTableExists());
      assert.isFalse(extensionsDao.isTableExists());
    });

  //   it('should return the index status of false', function() {
  //     const fti = new FeatureTableIndex(geoPackage, featureDao);
  //     const indexed = fti.isIndexed();
  //     indexed.should.be.equal(false);
  //   });
  //
  //   it('should check the index extension', function() {
  //     this.timeout(10000);
  //     const fti = new FeatureTableIndex(geoPackage, featureDao);
  //     fti.setProgress();
  //     return fti.index(false, function(message) {
  //       console.log('message', message);
  //     })
  //     .then(function(indexed) {
  //       indexed.should.be.equal(true);
  //       // ensure it was created
  //       var fti2 = new FeatureTableIndex(geoPackage, featureDao);
  //       fti2.isIndexed().should.be.equal(true);
  //     })
  //     .then(function() {
  //       var exists = fti.hasExtension(fti.extensionName, fti.tableName, fti.columnName)
  //       exists.should.be.equal(true);
  //     })
  //     .then(function() {
  //       var extensionDao = fti.extensionsDao;
  //       var extension = extensionDao.queryByExtension(fti.extensionName);
  //       extension.author.should.be.equal('nga');
  //       extension.extensionNameNoAuthor.should.be.equal('geometry_index');
  //       extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
  //       extension.column_name.should.be.equal('geom');
  //       extension.table_name.should.be.equal('FEATURESriversds');
  //       extension.scope.should.be.equal('read-write');
  //       extension.extension_name.should.be.equal('nga_geometry_index');
  //     })
  //     .then(function() {
  //       var extensionDao = fti.extensionsDao;
  //       var extensions = extensionDao.queryByExtensionAndTableName(fti.extensionName, fti.tableName);
  //       var extension = extensions[0];
  //       extension.author.should.be.equal('nga');
  //       extension.extensionNameNoAuthor.should.be.equal('geometry_index');
  //       extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
  //       extension.column_name.should.be.equal('geom');
  //       extension.table_name.should.be.equal('FEATURESriversds');
  //       extension.scope.should.be.equal('read-write');
  //       extension.extension_name.should.be.equal('nga_geometry_index');
  //     })
  //     .then(function() {
  //       var extensionDao = fti.extensionsDao;
  //       var extensions = extensionDao.queryByExtensionAndTableNameAndColumnName(fti.extensionName, fti.tableName, fti.columnName);
  //       var extension = extensions[0];
  //       extension.author.should.be.equal('nga');
  //       extension.extensionNameNoAuthor.should.be.equal('geometry_index');
  //       extension.definition.should.be.equal('http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html');
  //       extension.column_name.should.be.equal('geom');
  //       extension.table_name.should.be.equal('FEATURESriversds');
  //       extension.scope.should.be.equal('read-write');
  //       extension.extension_name.should.be.equal('nga_geometry_index');
  //     });
  //   });
  //
  //   it('should index the table from the geoPackage object', function() {
  //     this.timeout(10000);
  //     return geoPackage.indexFeatureTable('FEATURESriversds')
  //     .then(function(indexed) {
  //       indexed.should.be.equal(true);
  //       // ensure it was created
  //       var fti = featureDao.featureTableIndex;
  //       const isIndexed = fti.isIndexed();
  //       isIndexed.should.be.equal(true);
  //     });
  //   });
  //
  //   it('should index the geoPackage from the geoPackage object', function() {
  //     this.timeout(10000);
  //     return geoPackage.index()
  //     .then(function(status) {
  //       status.should.be.equal(true);
  //       // ensure it was created
  //       var fti = featureDao.featureTableIndex;
  //       fti.isIndexed().should.be.equal(true);
  //     });
  //   });
  // });
  //
  // describe('Test existing index', function() {
  //
  //   var geoPackage;
  //   var featureDao;
  //
  //   var originalFilename = path.join(__dirname, '..', '..', '..', 'fixtures', 'rivers_indexed.gpkg');
  //   var filename;
  //
  //   beforeEach('should open the geoPackage', async function() {
  //     // @ts-ignore
  //     let result = await copyAndOpenGeopackage(originalFilename);
  //     filename = result.path;
  //     geoPackage = result.geoPackage;
  //     featureDao = geoPackage.getFeatureDao('rivers');
  //   });
  //
  //   afterEach('should close the geoPackage', async function() {
  //     geoPackage.close();
  //     await testSetup.deleteGeoPackage(filename);
  //   });
  //
  //   it('should query for the index row rivers, 315', function(done) {
  //     var whereString = 'table_name = ? and geom_id = ?';
  //     var whereArgs = [ 'rivers', 315 ];
  //
  //     var query = sqliteQueryBuilder.buildQuery(false, "'nga_geometry_index'", undefined, whereString);
  //     var result = geoPackage.getDatabase().get(query, whereArgs);
  //     should.exist(result);
  //     done();
  //   });
  //
  //   it('should get the extension row', function() {
  //     var fti = featureDao.featureTableIndex;
  //     var extension = fti.getFeatureTableIndexExtension();
  //     should.exist(extension);
  //   });
  //
  //   it('should return the index status of true', function() {
  //     var fti = featureDao.featureTableIndex;
  //     var indexed = fti.isIndexed();
  //     indexed.should.be.equal(true);
  //   });
  //
  //   it('should force index the table', function() {
  //     this.timeout(30000);
  //     var fti = featureDao.featureTableIndex;
  //     var tableIndex = fti.tableIndex;
  //     tableIndex.last_indexed.should.be.equal('2016-05-02T12:08:14.144Z');
  //     return fti.ngaIndexWithForce(true)
  //     .then(function(indexed) {
  //       indexed.should.be.equal(true);
  //       // ensure it was created
  //       var fti2 = new FeatureTableIndex(geoPackage, featureDao);
  //       tableIndex = fti2.tableIndex;
  //       should.exist(tableIndex);
  //       tableIndex.last_indexed.should.not.be.equal('2016-05-02T12:08:14.144Z');
  //     });
  //   });
  });
});
