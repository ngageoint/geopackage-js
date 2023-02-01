import {
  GeoPackageManager,
  GeometryColumns,
  FeatureColumn,
  GeoPackageDataType,
  BoundingBox,
  FeatureTableMetadata,
  FeatureIndexType,
} from '../index';
import { Canvas } from '../lib/canvas/canvas';
import { Projections } from '@ngageoint/projections-js';
import { GeometryType } from '@ngageoint/simple-features-js';
const testSetup = require('./testSetup').default;

const path = require('path'),
  fs = require('fs-extra'),
  nock = require('nock'),
  mock = require('xhr-mock').default,
  should = require('chai').should();

describe('GeoPackageManager tests', function () {
  const existingPath = path.join(__dirname, 'fixtures', 'rivers.gpkg');
  const geopackageToCreate = path.join(__dirname, 'fixtures', 'tmp', 'tmp.gpkg');
  const tilePath = path.join(__dirname, 'fixtures', 'tiles', '0', '0', '0.png');
  const indexedPath = path.join(__dirname, 'fixtures', 'rivers_indexed.gpkg');
  const base = 'http://ngageoint.github.io';
  const urlPath = '/GeoPackage/examples/rivers.gpkg';
  const url = base + urlPath;
  const badUrl = base + '/bad';
  const errorUrl = base + '/error';

  beforeEach(function () {
    if (!nock.isActive()) {
      nock.activate();
    }
    mock.setup();
  });

  afterEach(function () {
    nock.restore();
    mock.teardown();
  });

  it('should open the geoPackage', async function () {
    const newPath = await testSetup.copyGeopackage(existingPath);
    const geoPackage = await GeoPackageManager.open(newPath);
    should.exist(geoPackage);
    should.exist(geoPackage.getTables);
    geoPackage.close();

    await testSetup.deleteGeoPackage(newPath);
  });

  it('should open the geoPackage with a promise', function () {
    let gppath;

    return testSetup
      .copyGeopackage(existingPath)
      .then(function (newPath) {
        gppath = newPath;
        return GeoPackageManager.open(gppath);
      })
      .then(function (geoPackage) {
        should.exist(geoPackage);
        should.exist(geoPackage.getTables);
      })
      .then(function () {
        return testSetup.deleteGeoPackage(gppath);
      });
  });

  it('should open the geoPackage from a URL', function () {
    let gppath;

    return testSetup
      .copyGeopackage(existingPath)
      .then(function (newPath) {
        gppath = newPath;
        nock(base).get(urlPath).replyWithFile(200, gppath);
        mock.get(url, {
          body: fs.readFileSync(gppath).buffer,
        });
      })
      .then(function () {
        return GeoPackageManager.open(url);
      })
      .then(function (geoPackage) {
        should.exist(geoPackage);
        should.exist(geoPackage.getTables);
      })
      .then(function () {
        return testSetup.deleteGeoPackage(gppath);
      })
      .catch(function (err) {
        should.fail('', err);
      });
  });

  it('should throw an error if the URL returns an error', function () {
    nock(base).get('/error').replyWithError('error');
    mock.get(errorUrl, function () {
      return Promise.reject(new Error());
    });
    return GeoPackageManager.open(errorUrl)

      .then(function () {
        should.fail(true, false, 'Should have failed');
      })
      .catch(function (err) {
        should.exist(err);
      });
  });

  it('should throw an error if the URL does not return 200', function () {
    nock(base).get('/bad').reply(404);
    mock.get(badUrl, {
      status: 404,
    });
    return GeoPackageManager.open(badUrl)

      .then(function () {
        should.fail(false, true);
      })
      .catch(function (err) {
        should.exist(err);
      });
  });

  it('should not open a file without the minimum tables', async function () {
    await testSetup.createBareGeoPackage(geopackageToCreate);
    try {
      const geoPackage = await GeoPackageManager.open(geopackageToCreate);
      should.not.exist(geoPackage);
    } catch (e) {
      should.exist(e);
    }

    await testSetup.deleteGeoPackage(geopackageToCreate);
  });

  it('should not open a file without the correct extension', async function () {
    try {
      const geoPackage = await GeoPackageManager.open(tilePath);
      should.not.exist(geoPackage);
    } catch (e) {
      should.exist(e);
    }
  });

  it('should not open a file without the correct extension via promise', function () {
    GeoPackageManager.open(tilePath).catch(function (error) {
      should.exist(error);
    });
  });

  it('should open the geoPackage byte array', async function () {
    const data = await fs.readFile(existingPath);
    const geoPackage = await GeoPackageManager.open(data);
    should.exist(geoPackage);
  });

  it('should not open a byte array that is not a geoPackage', async function () {
    const data = await fs.readFile(tilePath);
    try {
      const geoPackage = await GeoPackageManager.open(data);
      should.not.exist(geoPackage);
    } catch (err) {
      should.exist(err);
    }
  });

  it('should not create a geoPackage without the correct extension', async function () {
    try {
      const gp = await GeoPackageManager.create(tilePath);
      should.fail(gp, null, 'Error should have been thrown');
    } catch (e) {
      should.exist(e);
      return;
    }
    should.fail(false, true, 'Error should have been thrown');
  });

  it('should not create a geoPackage without the correct extension return promise', function (done) {
    GeoPackageManager.create(tilePath)

      .then(function () {
        // should not get called
        false.should.be.equal(true);
      })
      .catch(function (error) {
        should.exist(error);
        done();
      });
  });

  it('should create a geoPackage', async function () {
    const gp = await GeoPackageManager.create(geopackageToCreate);
    should.exist(gp);
    should.exist(gp.getTables);
    await testSetup.deleteGeoPackage(geopackageToCreate);
  });

  it('should create a geoPackage with a promise', function () {
    GeoPackageManager.create(geopackageToCreate).then(async function (geoPackage) {
      should.exist(geoPackage);
      should.exist(geoPackage.getTables);
      await testSetup.deleteGeoPackage(geopackageToCreate);
    });
  });

  it('should create a geoPackage and export it', async function () {
    const gp = await GeoPackageManager.create(geopackageToCreate);
    should.exist(gp);
    const buffer = await gp.export();
    should.exist(buffer);
    await testSetup.deleteGeoPackage(geopackageToCreate);
  });

  it('should create a geoPackage in memory', async function () {
    const gp = await GeoPackageManager.create();
    should.exist(gp);
  });

  describe('should operate on an indexed geoPackage', function () {
    let indexedGeopackage;
    const originalFilename = indexedPath;
    let filename;

    beforeEach('should open the geoPackage', async function () {
      const result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      indexedGeopackage = result.geoPackage;
    });

    afterEach('should close the geoPackage', async function () {
      indexedGeopackage.close();

      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the tables', function () {
      const tables = indexedGeopackage.getTables();
      tables.should.be.deep.equal(['rivers', 'rivers_tiles']);
    });

    it('should get the tile tables', function () {
      const tables = indexedGeopackage.getTileTables();
      tables.should.be.deep.equal(['rivers_tiles']);
    });

    it('should get the feature tables', function () {
      const tables = indexedGeopackage.getFeatureTables();
      tables.should.be.deep.equal(['rivers']);
    });

    it('should check if it has feature table', function () {
      const exists = indexedGeopackage.hasFeatureTable('rivers');
      exists.should.be.equal(true);
    });

    it('should check if does not have feature table', function () {
      const exists = indexedGeopackage.hasFeatureTable('rivers_no');
      exists.should.be.equal(false);
    });

    it('should check if it has tile table', function () {
      const exists = indexedGeopackage.hasTileTable('rivers_tiles');
      exists.should.be.equal(true);
    });

    it('should check if does not have tile table', function () {
      const exists = indexedGeopackage.hasTileTable('rivers_tiles_no');
      exists.should.be.equal(false);
    });

    it('should get the 0 0 0 tile', function () {
      return indexedGeopackage.xyzTile('rivers_tiles', 0, 0, 0, 256, 256).then(function (tile) {
        should.exist(tile);
      });
    });

    it('should get the 0 0 0 tile in a canvas', async function () {
      let canvas = Canvas.create(256, 256);
      const geoPackageTile = await indexedGeopackage.xyzTile('rivers_tiles', 0, 0, 0, 256, 256);
      const image = await geoPackageTile.getGeoPackageImage();
      canvas.getContext('2d').drawImage(image.getImage(), 0, 0);
      Canvas.disposeImage(image);
      await testSetup.diffCanvas(canvas, path.join(__dirname, 'fixtures', '3857_rivers_world_tile.png'));
      Canvas.disposeCanvas(canvas);
    });

    it('should get the world as a 4326 tile in a canvas', async function () {
      let canvas = Canvas.create(256, 256);
      const geoPackageTile = await indexedGeopackage.projectedTile(
        'rivers_tiles',
        -90,
        -180,
        90,
        180,
        0,
        Projections.getWGS84Projection(),
        512,
        256,
      );
      const image = await geoPackageTile.getGeoPackageImage();
      canvas.getContext('2d').drawImage(image.getImage(), 0, 0);
      Canvas.disposeImage(image);
      await testSetup.diffCanvas(canvas, path.join(__dirname, 'fixtures', '4326_rivers_world_tile.png'));
      Canvas.disposeCanvas(canvas);
    });

    // it('should get the 0 0 0 vector tile', function() {
    //   var vectorTile = GeoPackage.getVectorTile(indexedGeopackage, 'rivers', 0, 0, 0);
    //   should.exist(vectorTile);
    // });

    it('should query for the tiles in the bounding box', function () {
      const tiles = indexedGeopackage.getTilesInBoundingBoxWebZoom('rivers_tiles', 0, -180, 180, -80, 80);
      tiles.tiles.length.should.be.equal(1);
    });

    it('should add geojson to the geoPackage and keep it indexed', function () {
      const id = indexedGeopackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            property_0: 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-99.84374999999999, 40.17887331434696],
          },
        },
        'rivers',
        FeatureIndexType.GEOPACKAGE,
      );
      // ensure the last indexed changed
      const db = indexedGeopackage.getDatabase().getConnectionSource();
      const index = db.get('SELECT * FROM nga_geometry_index where geom_id = ?', [id]);
      index.geom_id.should.be.equal(id);
    });

    it('should add several geojson features to the geoPackage and index them', function (done) {
      this.timeout(5000);
      const features = [];
      for (let i = 0; i < 100; i++) {
        features.push({
          type: 'Feature',
          properties: {
            property_0: 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-179, 20.5],
          },
        });
      }
      indexedGeopackage.addGeoJSONFeaturesToGeoPackage(features, 'rivers', true).then(() => {
        const results = indexedGeopackage.queryForGeoJSONFeatures(
          'rivers',
          new BoundingBox(-179, 20.5, -179, 20.5).projectBoundingBox(
            Projections.getWGS84Projection(),
            Projections.getWebMercatorProjection(),
          ),
        );
        const queried = [];
        for (const feature of results) {
          queried.push(feature);
        }
        results.close();
        queried.length.should.be.equal(100);
        done();
      });
    });

    it('should add geojson to the geoPackage and keep it indexed and query it', function () {
      indexedGeopackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            property_0: 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-179, 20],
          },
        },
        'rivers',
        FeatureIndexType.GEOPACKAGE,
      );
      const results = indexedGeopackage.queryForGeoJSONFeatures(
        'rivers',
        new BoundingBox(-179, 20, -179, 20).projectBoundingBox(
          Projections.getWGS84Projection(),
          Projections.getWebMercatorProjection(),
        ),
      );
      const features = [];
      for (const feature of results) {
        features.push(feature);
      }
      results.close();
      features.length.should.be.equal(1);
    });

    it('should add geojson to the geoPackage and keep it indexed and iterate it', async function () {
      indexedGeopackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            property_0: 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-99.84374999999999, 40.17887331434696],
          },
        },
        'rivers',
        FeatureIndexType.GEOPACKAGE,
      );
      const iterator = indexedGeopackage.queryForGeoJSONFeatures('rivers', new BoundingBox(-99.9, 40.16, -99.8, 40.18));
      for (const geoJson of iterator) {
        geoJson.properties.Scalerank.should.be.equal('test');
      }
    });

    it('should add geojson to the geoPackage and keep it indexed and iterate it and pull the features', function () {
      indexedGeopackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            property_0: 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-99.84374999999999, 40.17887331434696],
          },
        },
        'rivers',
        FeatureIndexType.GEOPACKAGE,
      );
      const iterator = indexedGeopackage.queryForGeoJSONFeatures('rivers');
      for (const geoJson of iterator) {
        should.exist(geoJson.properties);
      }
      iterator.close();
    });
  });

  describe('operating on a new geoPackage', function () {
    let geoPackage;

    beforeEach(function (done) {
      fs.unlink(geopackageToCreate, async function () {
        geoPackage = await GeoPackageManager.create(geopackageToCreate);
        done();
      });
    });

    afterEach(async function () {
      await testSetup.deleteGeoPackage(geopackageToCreate);
    });

    it('should create a feature table', function () {
      const columns = [];

      const tableName = 'features';

      const geometryColumns = new GeometryColumns();
      geometryColumns.setTableName(tableName);
      geometryColumns.setColumnName('geometry');
      geometryColumns.setGeometryType(GeometryType.GEOMETRY);
      geometryColumns.setZ(0);
      geometryColumns.setM(0);
      geometryColumns.setSrsId(4326);

      columns.push(FeatureColumn.createColumn('test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
      columns.push(FeatureColumn.createColumn('test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
      columns.push(FeatureColumn.createColumn('test_text.test', GeoPackageDataType.TEXT, false, ''));
      columns.push(FeatureColumn.createColumn('test_real.test', GeoPackageDataType.REAL, false, null));
      columns.push(FeatureColumn.createColumn('test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumn('test_blob.test', GeoPackageDataType.BLOB, false, null));
      columns.push(FeatureColumn.createColumn('test_integer.test', GeoPackageDataType.INTEGER, false, null));

      let featureDao = geoPackage.createFeatureTableWithMetadata(FeatureTableMetadata.create(geometryColumns, columns));
      should.exist(featureDao);
      const exists = geoPackage.hasFeatureTable(tableName);
      exists.should.be.equal(true);
      const results = geoPackage.getFeatureTables();
      results.length.should.be.equal(1);
      results[0].should.be.equal(tableName);
      let id = geoPackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            'test_text_limited.test': 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-99.84374999999999, 40.17887331434696],
          },
        },
        tableName,
      );
      id.should.be.equal(1);
      id = geoPackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            'test_text_limited.test': 'test',
          },
          geometry: {
            type: 'Point',
            coordinates: [-99.84374999999999, 40.17887331434696],
          },
        },
        tableName,
      );
      id.should.be.equal(2);
      let feature = geoPackage.getFeature(tableName, 2);
      should.exist(feature);
      feature.getId().should.be.equal(2);
      should.exist(feature.getGeometry());
      let count = 0;
      let geoJSONResultSet = geoPackage.queryForGeoJSONFeatures(tableName);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const row of geoJSONResultSet) {
        count++;
      }
      geoJSONResultSet.close();
      count.should.be.equal(2);
    });
    it('should create a feature table with a null geometry', function () {
      const columns = [];

      const tableName = 'features';

      const geometryColumns = new GeometryColumns();
      geometryColumns.setTableName(tableName);
      geometryColumns.setColumnName('geometry');
      geometryColumns.setGeometryType(GeometryType.GEOMETRY);
      geometryColumns.setZ(0);
      geometryColumns.setM(0);
      geometryColumns.setSrsId(4326);

      columns.push(FeatureColumn.createColumn('test_text_limited.test', GeoPackageDataType.TEXT, false, null, 5));
      columns.push(FeatureColumn.createColumn('test_blob_limited.test', GeoPackageDataType.BLOB, false, null, 7));
      columns.push(FeatureColumn.createColumn('test_text.test', GeoPackageDataType.TEXT, false, ''));
      columns.push(FeatureColumn.createColumn('test_real.test', GeoPackageDataType.REAL, false, null));
      columns.push(FeatureColumn.createColumn('test_boolean.test', GeoPackageDataType.BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumn('test_blob.test', GeoPackageDataType.BLOB, false, null));
      columns.push(FeatureColumn.createColumn('test_integer.test', GeoPackageDataType.INTEGER, false, null));

      let featureDao = geoPackage.createFeatureTableWithMetadata(FeatureTableMetadata.create(geometryColumns, columns));
      should.exist(featureDao);
      const exists = geoPackage.hasFeatureTable(tableName);
      exists.should.be.equal(true);
      const results = geoPackage.getFeatureTables();
      results.length.should.be.equal(1);
      results[0].should.be.equal(tableName);
      let id = geoPackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            'test_text_limited.test': 'test',
          },
          geometry: null,
        },
        tableName,
      );
      id.should.be.equal(1);
      id = geoPackage.addGeoJSONFeatureToGeoPackage(
        {
          type: 'Feature',
          properties: {
            'test_text_limited.test': 'test',
          },
          geometry: null,
        },
        tableName,
      );
      id.should.be.equal(2);
      let feature = geoPackage.getFeature(tableName, 2);
      should.exist(feature);
      feature.getId().should.be.equal(2);
      should.exist(feature.getGeometry());
      let each = geoPackage.queryForGeoJSONFeatures(tableName);
      let count = 0;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const row of each) {
        count++;
      }
      each.close();
      count.should.be.equal(2);
    });
    it('should create a tile table', function () {
      const tableName = 'tiles';

      const contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
      const contentsSrsId = 4326;
      const tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
      const tileMatrixSetSrsId = 4326;
      let tileMatrixSet = geoPackage.createTileTableWithTableName(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
      );
      should.exist(tileMatrixSet);
      const exists = geoPackage.hasTileTable('tiles');
      exists.should.be.equal(true);
      const tables = geoPackage.getTileTables();
      tables.length.should.be.equal(1);
      tables[0].should.be.equal('tiles');
    });

    it('should create a standard web mercator tile table with the default tile size', function () {
      const tableName = 'tiles_web_mercator';
      const contentsBounds = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const matrixSetBounds = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      const matrixSet = geoPackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBounds,
        contentsSrsId,
        matrixSetBounds,
        tileMatrixSetSrsId,
        0,
        3,
      );
      matrixSet.getTableName().should.equal(tableName);
      matrixSet.getSrsId().should.equal(3857);
      matrixSet.getMinX().should.equal(matrixSetBounds.getMinLongitude());
      matrixSet.getMaxX().should.equal(matrixSetBounds.getMaxLongitude());
      matrixSet.getMinY().should.equal(matrixSetBounds.getMinLatitude());
      matrixSet.getMaxY().should.equal(matrixSetBounds.getMaxLongitude());

      const dbMatrixSet = geoPackage.getTileMatrixSetDao().queryForId(tableName);
      dbMatrixSet.should.deep.equal(matrixSet);

      const matrixDao = geoPackage.getTileMatrixDao();
      const matrices = matrixDao.queryForAll().map((result) => matrixDao.createObject(result));

      matrices.length.should.equal(4);
      matrices.forEach((matrix) => {
        matrix.getTileWidth().should.equal(256);
        matrix.getTileHeight().should.equal(256);
      });
    });

    it('should create a standard plate carreé tile table with the default tile size', function () {
      const tableName = 'tiles_web_mercator';
      const contentsBounds = new BoundingBox(-180, -90, 180, 90);
      const contentsSrsId = 4326;
      const matrixSetBounds = new BoundingBox(-180, -90, 180, 90);
      const tileMatrixSetSrsId = 4326;

      const matrixSet = geoPackage.createStandardWGS84TileTable(
        tableName,
        contentsBounds,
        contentsSrsId,
        matrixSetBounds,
        tileMatrixSetSrsId,
        0,
        3,
      );
      matrixSet.table_name.should.equal(tableName);
      matrixSet.srs_id.should.equal(4326);
      matrixSet.min_x.should.equal(matrixSetBounds.minLongitude);
      matrixSet.max_x.should.equal(matrixSetBounds.maxLongitude);
      matrixSet.min_y.should.equal(matrixSetBounds.minLatitude);
      matrixSet.max_y.should.equal(matrixSetBounds.maxLatitude);

      const dbMatrixSet = geoPackage.tileMatrixSetDao.queryForId(tableName);
      dbMatrixSet.should.deep.equal(matrixSet);

      const matrixDao = geoPackage.tileMatrixDao;
      const matrices = matrixDao.queryForAll();

      matrices.length.should.equal(4);
      matrices.forEach((matrix) => {
        matrix.tile_width.should.equal(256);
        matrix.tile_height.should.equal(256);
      });
    });

    it('should create a standard web mercator tile table with a custom tile size', function () {
      const tableName = 'custom_tile_size';
      const contentsBounds = new BoundingBox(-31644.9297, 4127.5995, 6697565.2924, 6723706.7561);
      const matrixSetBounds = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const tileSize = 320;

      let matrixSet = geoPackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBounds,
        3857,
        matrixSetBounds,
        3857,
        9,
        13,
        tileSize,
      );
      matrixSet.getTableName().should.equal(tableName);
      matrixSet.getSrsId().should.equal(3857);
      matrixSet.getMinX().should.equal(matrixSetBounds.getMinLongitude());
      matrixSet.getMaxX().should.equal(matrixSetBounds.getMaxLongitude());
      matrixSet.getMinY().should.equal(matrixSetBounds.getMinLatitude());
      matrixSet.getMaxY().should.equal(matrixSetBounds.getMaxLatitude());

      const dbMatrixSet = geoPackage.getTileMatrixSetDao().queryForId(tableName);
      dbMatrixSet.should.deep.equal(matrixSet);

      const matrixDao = geoPackage.getTileMatrixDao();
      const matrices = matrixDao.queryForAll().map((result) => matrixDao.createObject(result));

      matrices.length.should.equal(5);
      matrices.forEach((matrix) => {
        matrix.getTileWidth().should.equal(tileSize);
        matrix.getTileHeight().should.equal(tileSize);
      });
    });

    it('should add a tile to the tile table', function (done) {
      const tableName = 'tiles_web_mercator_2';
      const contentsBoundingBox = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const tileMatrixSetBoundingBox = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      let tileMatrixSet = geoPackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
        0,
        0,
      );
      should.exist(tileMatrixSet);

      loadTile(tilePath).then((tileData) => {
        const result = geoPackage.addTile(tileData, tableName, 0, 0, 0);
        result.should.be.equal(1);
        const tileRow = geoPackage.getTileFromTable(tableName, 0, 0, 0);

        testSetup.diffImages(tileRow.getTileData(), tilePath, function (err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should add a tile to the tile table and get it via xyz', function (done) {
      const tableName = 'tiles_web_mercator_3';

      const contentsBoundingBox = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const tileMatrixSetBoundingBox = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      const tileMatrixSet = geoPackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
        0,
        0,
      );
      should.exist(tileMatrixSet);

      fs.readFile(tilePath, function (err, tile) {
        const result = geoPackage.addTile(tile, tableName, 0, 0, 0);
        result.should.be.equal(1);
        geoPackage.xyzTile(tableName, 0, 0, 0, 256, 256).then(function (tile) {
          testSetup.diffImages(tile.getData(), tilePath, function (err, equal) {
            equal.should.be.equal(true);
            done();
          });
        });
      });
    });

    it('should add a tile to the tile table and get it into a canvas via xyz', function (done) {
      const tableName = 'tiles_web_mercator_4';

      const contentsBoundingBox = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const tileMatrixSetBoundingBox = new BoundingBox(
        -20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      const tileMatrixSet = geoPackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
        0,
        0,
      );
      should.exist(tileMatrixSet);

      fs.readFile(tilePath, function (err, tile) {
        const result = geoPackage.addTile(tile, tableName, 0, 0, 0);
        result.should.be.equal(1);
        Canvas.initializeAdapter().then(() => {
          let canvas = Canvas.create(256, 256);
          geoPackage
            .xyzTile(tableName, 0, 0, 0, 256, 256)

            .then(function (tile) {
              tile.getGeoPackageImage().then((image) => {
                canvas.getContext('2d').drawImage(image.getImage(), 0, 0);

                testSetup.diffCanvas(canvas, tilePath, function (err, equal) {
                  equal.should.be.equal(true);
                  Canvas.disposeCanvas(canvas);
                  done();
                });
              });
            });
        });
      });
    });
  });
});
