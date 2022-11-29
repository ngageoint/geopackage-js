import { default as testSetup } from '../../../../testSetup'
import { FeatureTileTableLinker } from "../../../../../lib/extension/nga/link/featureTileTableLinker";

var should = require('chai').should()
  , assert = require('chai').assert
  , path = require('path');

describe('FeatureTileTableLinker tests', function() {

  describe('Test Link', function() {
    var geoPackage;

    var originalFilename = path.join(__dirname, '..', '..', '..', '..', 'fixtures', 'import_db.gpkg');
    var filename;

    beforeEach('should open the geoPackage', async function() {
      // @ts-ignore
      let result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      geoPackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function() {
      geoPackage.close();
      await testSetup.deleteGeoPackage(filename);
    });

    it('should test rtree index extension', function() {
      geoPackage.getExtensionManager().deleteExtensions();

      const linker = new FeatureTileTableLinker(geoPackage);
      assert.isFalse(linker.has());

      // Test linking feature and tile tables
      const featureTables = geoPackage.getFeatureTables();
      const tileTables = geoPackage.getTileTables();

      if (featureTables.length > 0 && tileTables.length > 0) {
        const dao = linker.getDao();
        const linkedFeatureTables = [];
        for (const featureTable of featureTables) {
          linkedFeatureTables.push(featureTable);
          const linkedTileTables = [];
          for (const tileTable of tileTables) {
            linkedTileTables.push(tileTable);

            assert.isFalse(linker.isLinked(featureTable, tileTable));

            let count = 0;
            if (dao.isTableExists()) {
              count = dao.count();
            }

            // Link the tables
            linker.link(featureTable, tileTable);
            assert.isTrue(linker.isLinked(featureTable, tileTable));
            dao.count().should.be.equal(count + 1)
            assert.isTrue(linker.has());

            // Shouldn't hurt to link it twice
            linker.link(featureTable, tileTable);
            assert.isTrue(linker.isLinked(featureTable, tileTable));
            dao.count().should.be.equal(count + 1)
            assert.isTrue(linker.has());

            // Verify linked feature tables
            let links = linker.queryForTileTable(tileTable);
            linkedFeatureTables.length.should.be.equal(links.length);
            for (const link of links) {
              assert.isTrue(linkedFeatureTables.indexOf(link.getFeatureTableName()) > -1);
            }

            // Verify linked tile tables
            links = linker.queryForFeatureTable(featureTable);
            linkedTileTables.length.should.be.equal(links.length);
            for (const link of links) {
              assert.isTrue(linkedTileTables.indexOf(link.getTileTableName()) > -1);
            }
          }
        }

        const extension = linker.getExtension(FeatureTileTableLinker.EXTENSION_NAME)[0];
        FeatureTileTableLinker.EXTENSION_NAME.should.be.equal(extension.getExtensionName());
        FeatureTileTableLinker.EXTENSION_AUTHOR.should.be.equal(extension.getAuthor());
        FeatureTileTableLinker.EXTENSION_NAME_NO_AUTHOR.should.be.equal(extension.getExtensionNameNoAuthor());
        FeatureTileTableLinker.EXTENSION_DEFINITION.should.be.equal(extension.getDefinition());
        assert.isNull(extension.getTableName());
        assert.isNull(extension.getColumnName());

        // Delete a single link
        let count = dao.count();
        const featureTable = featureTables[0];
        const tileTable = tileTables[0];
        assert.isTrue(linker.isLinked(featureTable, tileTable));
        linker.deleteLink(featureTable, tileTable);
        assert.isFalse(linker.isLinked(featureTable, tileTable));
        dao.count().should.be.equal(count - 1);

        // Delete all links from a feature table
        if (tileTables.length > 1) {
          let linkedTables = linker.queryForFeatureTable(featureTable).length;
          assert.isTrue(linkedTables > 0);
          let deletedCount = linker.deleteLinks(featureTable);
          linkedTables.should.be.equal(deletedCount);
          linker.queryForFeatureTable(featureTable).length.should.be.equal(0);
        }

        // Delete all links from a tile table
        if (featureTables.length > 1) {
          let linkedTables = linker.queryForTileTable(tileTable).length;
          assert.isTrue(linkedTables > 0);
          let deletedCount = linker.deleteLinks(tileTable);
          assert.isTrue(linkedTables === deletedCount);
          assert.isTrue(0 === linker.queryForTileTable(tileTable).length);
        }

        assert.isTrue(dao.isTableExists());
        assert.isNotNull(linker.get(FeatureTileTableLinker.EXTENSION_NAME));

        // Test deleting all NGA extensions
        geoPackage.getExtensionManager().deleteExtensions();

        assert.isFalse(dao.isTableExists());
        assert.isNull(linker.get(FeatureTileTableLinker.EXTENSION_NAME));

        for (const ft of featureTables) {
          for (const tt of tileTables) {
            assert.isFalse(linker.isLinked(ft, tt));
          }
        }
        assert.isFalse(dao.isTableExists());
        assert.isNull(linker.get(FeatureTileTableLinker.EXTENSION_NAME));
      }
    });
  });
});
