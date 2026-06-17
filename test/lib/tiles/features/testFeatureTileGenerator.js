import { default as testSetup } from '../../../testSetup';
import { FeatureIndexManager } from '../../../../lib/features/index/featureIndexManager';
import { FeatureIndexType } from '../../../../lib/features/index/featureIndexType';
import { FeatureTileUtils } from './featureTileUtils';
import { FeatureTileGenerator } from '../../../../lib/tiles/features/featureTileGenerator';
import { Projections } from '@ngageoint/projections-js';
import { TileBoundingBoxUtils } from '../../../../lib/tiles/tileBoundingBoxUtils';

var NumberFeaturesTile = require('../../../../lib/tiles/features/custom/numberFeaturesTile').NumberFeaturesTile,
  assert = require('chai').assert,
  path = require('path');

describe('GeoPackage Feature Tile Generator', function () {
  var geoPackage;
  var filename;

  var testPath = path.join(__dirname, '..', '..', '..', 'fixtures', 'tmp');

  beforeEach('should create the GeoPackage', async function () {
    filename = path.join(testPath, testSetup.createTempName());
    geoPackage = await testSetup.createGeoPackage(filename);
  });

  afterEach('should close the geoPackage', async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  it('test tile generator', function () {
    this.timeout(10000);
    return testTileGenerator(false, false, false);
  });

  it('test tile generator with index', function () {
    this.timeout(10000);
    return testTileGenerator(true, false, false);
  });

  it('test tile generator with icon', function () {
    this.timeout(10000);
    return testTileGenerator(false, true, false);
  });

  it('test tile generator with max features', function () {
    this.timeout(10000);
    return testTileGenerator(false, false, true);
  });

  it('test tile generator with index and icon', function () {
    this.timeout(10000);
    return testTileGenerator(true, true, false);
  });

  it('test tile generator with index and icon and max features', function () {
    this.timeout(10000);
    return testTileGenerator(true, true, true);
  });

  /**
   * Test tile generator
   *
   * @param index
   * @param useIcon
   * @param maxFeatures
   */
  async function testTileGenerator(index, useIcon, maxFeatures) {
    const minZoom = 0;
    const maxZoom = 3;

    const featureDao = FeatureTileUtils.createFeatureDao(geoPackage);

    const num = FeatureTileUtils.insertFeatures(geoPackage, featureDao);

    const featureTiles = await FeatureTileUtils.createFeatureTiles(geoPackage, featureDao, useIcon);

    if (index) {
      const indexManager = new FeatureIndexManager(geoPackage, featureDao);
      featureTiles.setIndexManager(indexManager);
      indexManager.setIndexLocation(FeatureIndexType.GEOPACKAGE);
      const indexed = indexManager.index();
      assert.equal(num, indexed);
    }

    if (maxFeatures) {
      featureTiles.setMaxFeaturesPerTile(10);
      const numberFeaturesTile = new NumberFeaturesTile();
      if (!index) {
        numberFeaturesTile.setDrawUnindexedTiles(false);
      }
      featureTiles.setMaxFeaturesTileDraw(numberFeaturesTile);
    }

    const zoomLevels = [];
    for (let i = minZoom; i <= maxZoom; i++) {
      zoomLevels.push(i);
    }

    const tileGenerator = new FeatureTileGenerator(
      geoPackage,
      'gen_feature_tiles',
      featureTiles,
      geoPackage,
      zoomLevels,
      Projections.getWebMercatorProjection(),
    );
    tileGenerator.setXYZTiles(false);

    const tiles = await tileGenerator.generateTiles();

    let expectedTiles = 0;
    if (!maxFeatures || index) {
      if (!index) {
        const indexManager = new FeatureIndexManager(geoPackage, featureDao);
        featureTiles.setIndexManager(indexManager);
        indexManager.setIndexLocation(FeatureIndexType.GEOPACKAGE);
        const indexed = indexManager.index();
        assert.equal(num, indexed);
      }

      for (let z = minZoom; z <= maxZoom; z++) {
        const tileGrid = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(tileGenerator.getBoundingBox(), z);

        for (let x = tileGrid.getMinX(); x <= tileGrid.getMaxX(); x++) {
          for (let y = tileGrid.getMinY(); y <= tileGrid.getMaxY(); y++) {
            if (featureTiles.queryIndexedFeaturesCount(x, y, z) > 0) {
              const webMercatorBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBox(x, y, z);
              const results = featureTiles.queryIndexedFeatures(x, y, z);
              const tile = await featureTiles.drawTileWithFeatureIndexResults(
                z,
                webMercatorBoundingBox,
                results,
                Projections.getWebMercatorProjection(),
              );
              results.close();
              if (tile != null) {
                expectedTiles++;
              }
            }
          }
        }
      }
    }
    assert.equal(expectedTiles, tiles);
  }
});
