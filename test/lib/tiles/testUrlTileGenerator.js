import { TileBoundingBoxUtils } from '../../../lib/tiles/tileBoundingBoxUtils';
import { UrlTileGenerator } from '../../../lib/tiles/urlTileGenerator';
import { Projections } from '@ngageoint/projections-js';
import { BoundingBox } from '../../../lib/boundingBox';
import { ImageType } from '../../../lib/image/imageType';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';
import { TestGeoPackageProgress } from '../io/testGeoPackageProgress';
import { default as testSetup } from '../../testSetup';
import path from 'path';
const assert = require('chai').assert;

describe('URL Tile Generator', function () {
  var TABLE_NAME = 'generate_test';
  var BASE_URL = 'https://osm.gs.mil';
  var URL = BASE_URL + '/tiles/default/{z}/{x}/{y}.png';
  var filename;
  var geoPackage;
  var testPath = path.join(__dirname, '..', '..', 'fixtures', 'tmp');

  beforeEach('should create the GeoPackage', async function () {
    filename = path.join(testPath, testSetup.createTempName());
    geoPackage = await testSetup.createGeoPackage(filename);
  });

  afterEach('should close the geoPackage', async function () {
    geoPackage.close();
    await testSetup.deleteGeoPackage(filename);
  });

  /**
   * Test generating tiles1
   */
  it('test generate tiles', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(geoPackage, TABLE_NAME, URL, [1, 2], getBoundingBox(), getProjection());
    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  /**
   * Test generating tiles with jpeg compression
   */
  it('test generate tiles compress', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(geoPackage, TABLE_NAME, URL, [2, 3], getBoundingBox(), getProjection());
    tileGenerator.setCompressFormat(ImageType.JPEG);
    tileGenerator.setCompressQuality(1.0);
    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  /**
   * Test generating tiles with jpeg compression and quality
   */
  it('test generate tiles compress quality', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(geoPackage, TABLE_NAME, URL, [0, 1], getBoundingBox(), getProjection());
    tileGenerator.setCompressFormat(ImageType.JPEG);
    tileGenerator.setCompressQuality(0.7);
    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  /**
   * Test generating tiles in XYZ format
   */
  it('test generate tiles xyz', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(geoPackage, TABLE_NAME, URL, [1, 2], getBoundingBox(), getProjection());
    tileGenerator.setXYZTiles(true);
    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  /**
   * Test generating tiles with bounding box
   */
  it('test generate tiles bounded', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(
      geoPackage,
      TABLE_NAME,
      URL,
      [1, 2],
      new BoundingBox(-10, -10, 10, 10),
      getProjection(),
    );

    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  /**
   * Test generating tiles in XYZ format with bounding box
   */
  it('test generate tiles xyz bounded', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(
      geoPackage,
      TABLE_NAME,
      URL,
      [1, 2],
      new BoundingBox(-10, -10, 10, 10),
      getProjection(),
    );
    tileGenerator.setXYZTiles(true);

    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  /**
   * Test generating tiles with random bounds and zoom levels
   */
  it('test generate tiles random', function (done) {
    this.timeout(0);
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const minZoom = Math.round(Math.random() * 3.0);
      const maxZoom = minZoom + Math.round(Math.random() * 3.0);
      const point1 = testSetup.createPoint(false, false);
      const point2 = testSetup.createPoint(false, false);
      const boundingBox = new BoundingBox(
        Math.min(point1.x, point2.x),
        Math.min(point1.y, point2.y),
        Math.max(point1.x, point2.x),
        Math.max(point1.y, point2.y),
      );
      const tileGenerator = new UrlTileGenerator(
        geoPackage,
        TABLE_NAME + i,
        URL,
        [minZoom, maxZoom],
        boundingBox,
        getProjection(),
      );

      promises.push(_testGenerateTiles(tileGenerator));
    }
    Promise.allSettled(promises).then(() => done());
  });

  /**
   * Test generating tiles with png compression and quality
   */
  it('test generate tiles compress quality png', function (done) {
    this.timeout(0);
    const tileGenerator = new UrlTileGenerator(geoPackage, TABLE_NAME, URL, [0, 1], getBoundingBox(), getProjection());
    tileGenerator.setCompressFormat(ImageType.PNG);
    tileGenerator.setCompressQuality(0.7);
    _testGenerateTiles(tileGenerator).then(done).catch(done);
  });

  function getBoundingBox() {
    return getBoundingBoxWithBoundingBox(BoundingBox.worldWGS84());
  }

  function getBoundingBoxWithBoundingBox(boundingBox) {
    boundingBox = TileBoundingBoxUtils.boundWgs84BoundingBoxWithWebMercatorLimits(boundingBox);
    boundingBox = boundingBox.transform(
      GeometryTransform.create(Projections.getWGS84Projection(), Projections.getWebMercatorProjection()),
    );
    return boundingBox;
  }

  function getProjection() {
    return Projections.getWebMercatorProjection();
  }

  /**
   * Test generating tiles
   *
   * @param tileGenerator
   * @throws SQLException
   * @throws IOException
   */
  async function _testGenerateTiles(tileGenerator) {
    const geoPackage = tileGenerator.getGeoPackage();
    const tableName = tileGenerator.getTableName();
    const minZoom = tileGenerator.getMinZoom();
    const maxZoom = tileGenerator.getMaxZoom();
    const webMercatorBoundingBox = tileGenerator.getBoundingBox();

    const progress = new TestGeoPackageProgress();
    tileGenerator.setProgress(progress);

    const count = await tileGenerator.generateTiles();

    const expected = expectedTilesForZoomRange(webMercatorBoundingBox, minZoom, maxZoom);
    assert.equal(expected, count);
    assert.equal(expected, progress.getProgress());

    const tileDao = geoPackage.getTileDao(tableName);
    assert.equal(expected, tileDao.count());
    assert.equal(minZoom, tileDao.getMinZoom());
    assert.equal(maxZoom, tileDao.getMaxZoom());

    const tileMatrixSetBoundingBox = tileDao.getBoundingBox();

    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      const expectedTileGrid = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBoundingBox, zoom);
      const expectedBoundingBox = TileBoundingBoxUtils.getWebMercatorBoundingBoxWithTileGrid(expectedTileGrid, zoom);
      const zoomBoundingBox = tileDao.getBoundingBoxAtZoomLevel(zoom);
      assert.isTrue(Math.abs(expectedBoundingBox.getMinLongitude() - zoomBoundingBox.getMinLongitude()) < 0.000001);
      assert.isTrue(Math.abs(expectedBoundingBox.getMaxLongitude() - zoomBoundingBox.getMaxLongitude()) < 0.000001);
      assert.isTrue(Math.abs(expectedBoundingBox.getMinLatitude() - zoomBoundingBox.getMinLatitude()) < 0.000001);
      assert.isTrue(Math.abs(expectedBoundingBox.getMaxLatitude() - zoomBoundingBox.getMaxLatitude()) < 0.000001);
      const expectedZoomTiles = expectedTiles(webMercatorBoundingBox, zoom);
      assert.equal(expectedZoomTiles, tileDao.countAtZoomLevel(zoom));

      const tileMatrix = tileDao.getTileMatrix(zoom);

      const tileGrid = TileBoundingBoxUtils.getTileGrid(
        tileMatrixSetBoundingBox,
        tileMatrix.getMatrixWidth(),
        tileMatrix.getMatrixHeight(),
        zoomBoundingBox,
      );

      assert.isTrue(tileGrid.getMinX() >= 0);
      assert.isTrue(tileGrid.getMaxX() < tileMatrix.getMatrixWidth());
      assert.isTrue(tileGrid.getMinY() >= 0);
      assert.isTrue(tileGrid.getMaxY() < tileMatrix.getMatrixHeight());

      const resultSet = tileDao.queryForTiles(zoom);
      assert.equal(expectedZoomTiles, resultSet.getCount());
      let resultCount = 0;
      while (resultSet.moveToNext()) {
        const tileRow = resultSet.getRow();
        resultCount++;
        const tileData = tileRow.getTileData();
        assert.isNotNull(tileData);
        const image = await tileRow.getTileDataImage();
        assert.isNotNull(image);
        assert.equal(tileMatrix.getTileWidth(), image.getWidth());
        assert.equal(tileMatrix.getTileHeight(), image.getHeight());
      }
      assert.equal(expectedZoomTiles, resultCount);
    }
  }

  /**
   * Expected number of XYZ tiles between zoom range and bounding box
   *
   * @param webMercatorBoundingBox
   * @param minZoom
   * @param maxZoom
   * @return
   */
  function expectedTilesForZoomRange(webMercatorBoundingBox, minZoom, maxZoom) {
    let tiles = 0;
    for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
      tiles += expectedTiles(webMercatorBoundingBox, zoom);
    }
    return tiles;
  }

  /**
   * Expected number of XYZ tiles at zoom and bounding box
   * @param webMercatorBoundingBox
   * @param zoom
   * @return
   */
  function expectedTiles(webMercatorBoundingBox, zoom) {
    const tileGrid = TileBoundingBoxUtils.getTileGridWithBoundingBoxAndZoom(webMercatorBoundingBox, zoom);
    return tileGrid.count();
  }
});
