import { GeoPackageAPI } from '../index';
import { GeometryColumns, FeatureColumn, DataTypes, BoundingBox } from '../index';
const testSetup = require('./fixtures/testSetup').default;

const path = require('path'),
  fs = require('fs-extra'),
  // @ts-ignore
  nock = require('nock'),
  mock = require('xhr-mock').default,
  should = require('chai').should();

describe('GeoPackageAPI tests', function() {
  const existingPath = path.join(__dirname, 'fixtures', 'rivers.gpkg');
  const geopackageToCreate = path.join(__dirname, 'fixtures', 'tmp', 'tmp.gpkg');
  const tilePath = path.join(__dirname, 'fixtures', 'tiles', '0', '0', '0.png');
  const indexedPath = path.join(__dirname, 'fixtures', 'rivers_indexed.gpkg');
  const countriesPath = path.join(__dirname, 'fixtures', 'countries_0.gpkg');
  const base = 'http://ngageoint.github.io';
  const urlPath = '/GeoPackage/examples/rivers.gpkg';
  const url = base + urlPath;
  const badUrl = base + '/bad';
  const errorUrl = base + '/error';

  beforeEach(function() {
    if (!nock.isActive()) {
      nock.activate();
    }
    mock.setup();
  });

  afterEach(function() {
    // @ts-ignore
    nock.restore();
    mock.teardown();
  });

  it('should open the geopackage', async function() {
    // @ts-ignore
    const newPath = await testSetup.copyGeopackage(existingPath);
    const geopackage = await GeoPackageAPI.open(newPath);
    should.exist(geopackage);
    should.exist(geopackage.getTables);
    geopackage.close();
    // @ts-ignore
    await testSetup.deleteGeoPackage(newPath);
  });

  it('should open the geopackage with a promise', function() {
    let gppath;
    // @ts-ignore
    return testSetup
      .copyGeopackage(existingPath)
      .then(function(newPath) {
        gppath = newPath;
        return GeoPackageAPI.open(gppath);
      })
      .then(function(geopackage) {
        should.exist(geopackage);
        should.exist(geopackage.getTables);
      })
      .then(function() {
        // @ts-ignore
        return testSetup.deleteGeoPackage(gppath);
      });
  });

  it('should open the geopackage from a URL', function() {
    let gppath;
    // @ts-ignore
    return testSetup
      .copyGeopackage(existingPath)
      .then(function(newPath) {
        gppath = newPath;
        nock(base)
          .get(urlPath)
          .replyWithFile(200, gppath);
        mock.get(url, {
          body: fs.readFileSync(gppath).buffer,
        });
      })
      .then(function() {
        return GeoPackageAPI.open(url);
      })
      .then(function(geopackage) {
        should.exist(geopackage);
        should.exist(geopackage.getTables);
      })
      .then(function() {
        // @ts-ignore
        return testSetup.deleteGeoPackage(gppath);
      })
      .catch(function(err) {
        console.log('err', err);
        should.fail('', err);
      });
  });

  it('should throw an error if the URL returns an error', function() {
    nock(base)
      .get('/error')
      .replyWithError('error');
    mock.get(errorUrl, function() {
      return Promise.reject(new Error());
    });
    return (
      GeoPackageAPI.open(errorUrl)
        // @ts-ignore
        .then(function(geopackage) {
          should.fail(true, false, 'Should have failed');
        })
        .catch(function(err) {
          should.exist(err);
        })
    );
  });

  it('should throw an error if the URL does not return 200', function() {
    nock(base)
      .get('/bad')
      .reply(404);
    mock.get(badUrl, {
      status: 404,
    });
    return (
      GeoPackageAPI.open(badUrl)
        // @ts-ignore
        .then(function(geopackage) {
          should.fail(false, true);
        })
        .catch(function(err) {
          should.exist(err);
        })
    );
  });

  it('should not open a file without the minimum tables', async function() {
    // @ts-ignore
    await testSetup.createBareGeoPackage(geopackageToCreate);
    try {
      const geopackage = await GeoPackageAPI.open(geopackageToCreate);
      should.not.exist(geopackage);
    } catch (e) {
      should.exist(e);
    }
    // @ts-ignore
    await testSetup.deleteGeoPackage(geopackageToCreate);
  });

  it('should not open a file without the correct extension', async function() {
    try {
      const geopackage = await GeoPackageAPI.open(tilePath);
      should.not.exist(geopackage);
    } catch (e) {
      should.exist(e);
    }
  });

  it('should not open a file without the correct extension via promise', function() {
    GeoPackageAPI.open(tilePath).catch(function(error) {
      should.exist(error);
    });
  });

  it('should open the geopackage byte array', async function() {
    // @ts-ignore
    const data = await fs.readFile(existingPath);
    const geopackage = await GeoPackageAPI.open(data);
    should.exist(geopackage);
  });

  it('should not open a byte array that is not a geopackage', async function() {
    // @ts-ignore
    const data = await fs.readFile(tilePath);
    try {
      const geopackage = await GeoPackageAPI.open(data);
      should.not.exist(geopackage);
    } catch (err) {
      should.exist(err);
    }
  });

  it('should not create a geopackage without the correct extension', async function() {
    try {
      const gp = await GeoPackageAPI.create(tilePath);
      should.fail(gp, null, 'Error should have been thrown');
    } catch (e) {
      should.exist(e);
      return;
    }
    should.fail(false, true, 'Error should have been thrown');
  });

  it('should not create a geopackage without the correct extension return promise', function(done) {
    GeoPackageAPI.create(tilePath)
      // @ts-ignore
      .then(function(geopackage) {
        // should not get called
        false.should.be.equal(true);
      })
      .catch(function(error) {
        should.exist(error);
        done();
      });
  });

  it('should create a geopackage', async function() {
    const gp = await GeoPackageAPI.create(geopackageToCreate);
    should.exist(gp);
    should.exist(gp.getTables);
    await testSetup.deleteGeoPackage(geopackageToCreate);
  });

  it('should create a geopackage with a promise', function() {
    GeoPackageAPI.create(geopackageToCreate).then(async function(geopackage) {
      should.exist(geopackage);
      should.exist(geopackage.getTables);
      await testSetup.deleteGeoPackage(geopackageToCreate);
    });
  });

  it('should create a geopackage and export it', async function() {
    const gp = await GeoPackageAPI.create(geopackageToCreate);
    should.exist(gp);
    const buffer = await gp.export();
    should.exist(buffer);
    await testSetup.deleteGeoPackage(geopackageToCreate);
  });

  it('should create a geopackage in memory', async function() {
    const gp = await GeoPackageAPI.create();
    should.exist(gp);
  });

  describe('should operate on a GeoPacakge with lots of features', function() {
    let indexedGeopackage;
    const originalFilename = countriesPath;
    let filename;

    beforeEach('should open the geopackage', async function() {
      // @ts-ignore
      const result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      indexedGeopackage = result.geopackage;
    });

    afterEach('should close the geopackage', async function() {
      indexedGeopackage.close();
      // @ts-ignore
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the closest feature in an XYZ tile', function() {
      const closest = indexedGeopackage.getClosestFeatureInXYZTile('country', 0, 0, 0, 40, -119);
      closest.id.should.be.equal(481);
      closest.gp_table.should.be.equal('country');
      closest.distance.should.be.equal(0);
    });
  });

  describe('should operate on an indexed geopackage', function() {
    let indexedGeopackage;
    const originalFilename = indexedPath;
    let filename;

    beforeEach('should open the geopackage', async function() {
      // @ts-ignore
      const result = await copyAndOpenGeopackage(originalFilename);
      filename = result.path;
      indexedGeopackage = result.geopackage;
    });

    afterEach('should close the geopackage', async function() {
      indexedGeopackage.close();
      // @ts-ignore
      await testSetup.deleteGeoPackage(filename);
    });

    it('should get the tables', function() {
      const tables = indexedGeopackage.getTables();
      tables.should.be.deep.equal({ attributes: [], features: ['rivers'], tiles: ['rivers_tiles'] });
    });

    it('should get the tile tables', function() {
      const tables = indexedGeopackage.getTileTables();
      tables.should.be.deep.equal(['rivers_tiles']);
    });

    it('should get the feature tables', function() {
      const tables = indexedGeopackage.getFeatureTables();
      tables.should.be.deep.equal(['rivers']);
    });

    it('should check if it has feature table', function() {
      const exists = indexedGeopackage.hasFeatureTable('rivers');
      exists.should.be.equal(true);
    });

    it('should check if does not have feature table', function() {
      const exists = indexedGeopackage.hasFeatureTable('rivers_no');
      exists.should.be.equal(false);
    });

    it('should check if it has tile table', function() {
      const exists = indexedGeopackage.hasTileTable('rivers_tiles');
      exists.should.be.equal(true);
    });

    it('should check if does not have tile table', function() {
      const exists = indexedGeopackage.hasTileTable('rivers_tiles_no');
      exists.should.be.equal(false);
    });

    it('should get the 0 0 0 tile', function() {
      return indexedGeopackage.xyzTile('rivers_tiles', 0, 0, 0, 256, 256).then(function(tile) {
        should.exist(tile);
      });
    });

    it('should get the 0 0 0 tile in a canvas', async function() {
      let canvas;
      if (typeof process !== 'undefined' && process.version) {
        const Canvas = require('canvas');
        canvas = Canvas.createCanvas(256, 256);
      } else {
        canvas = document.createElement('canvas');
      }
      await indexedGeopackage.xyzTile('rivers_tiles', 0, 0, 0, 256, 256, canvas);
      testSetup.diffCanvas(canvas, path.join(__dirname, 'fixtures', '3857_rivers_world_tile.png'));
    });

    it('should get the world as a 4326 tile in a canvas', async function() {
      let canvas;
      if (typeof process !== 'undefined' && process.version) {
        const Canvas = require('canvas');
        canvas = Canvas.createCanvas(512, 256);
      } else {
        canvas = document.createElement('canvas');
      }
      await indexedGeopackage.projectedTile('rivers_tiles', -90, -180, 90, 180, 0, 'EPSG:4326', 512, 256, canvas);
      testSetup.diffCanvas(canvas, path.join(__dirname, 'fixtures', '4326_rivers_world_tile.png'));
    });

    // it('should get the 0 0 0 vector tile', function() {
    //   var vectorTile = GeoPackage.getVectorTile(indexedGeopackage, 'rivers', 0, 0, 0);
    //   should.exist(vectorTile);
    // });

    it('should query for the tiles in the bounding box', function() {
      const tiles = indexedGeopackage.getTilesInBoundingBoxWebZoom('rivers_tiles', 0, -180, 180, -80, 80);
      tiles.tiles.length.should.be.equal(1);
    });

    it('should add geojson to the geopackage and keep it indexed', function() {
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
        true
      );
      // ensure the last indexed changed
      const db = indexedGeopackage.database;
      const index = db.get('SELECT * FROM nga_geometry_index where geom_id = ?', [id]);
      index.geom_id.should.be.equal(id);
    });

    it('should add geojson to the geopackage and keep it indexed and query it', function() {
      // @ts-ignore
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
        true
      );
      const features = indexedGeopackage.queryForGeoJSONFeaturesInTable(
        'rivers',
        new BoundingBox(-99.9, -99.8, 40.16, 40.18),
      );
      features.length.should.be.equal(1);
    });

    it('should add geojson to the geopackage and keep it indexed and iterate it', async function() {
      // @ts-ignore
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
        true
      );
      const iterator = await indexedGeopackage.iterateGeoJSONFeatures(
        'rivers',
        new BoundingBox(-99.9, -99.8, 40.16, 40.18),
      );
      for (const geoJson of iterator) {
        geoJson.properties.Scalerank.should.be.equal('test');
      }
    });

    it('should add geojson to the geopackage and keep it indexed and iterate it and pull the features', function() {
      // @ts-ignore
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
        true
      );
      const iterator = indexedGeopackage.iterateGeoJSONFeatures('rivers');
      iterator.srs.should.exist;
      iterator.featureDao.should.exist;
      for (const geoJson of iterator) {
        // @ts-ignore
        should.exist(geoJson.properties);
      }
    });
  });

  describe('operating on a new geopackage', function() {
    let geopackage;

    beforeEach(function(done) {
      fs.unlink(geopackageToCreate, async function() {
        geopackage = await GeoPackageAPI.create(geopackageToCreate);
        done();
      });
    });

    afterEach(async function() {
      await testSetup.deleteGeoPackage(geopackageToCreate);
    });

    it('should create a feature table', function() {
      const columns = [];

      const tableName = 'features';

      const geometryColumns = new GeometryColumns();
      geometryColumns.table_name = tableName;
      geometryColumns.column_name = 'geometry';
      geometryColumns.geometry_type_name = 'GEOMETRY';
      geometryColumns.z = 0;
      geometryColumns.m = 0;

      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(
        FeatureColumn.createColumn(7, 'test_text_limited.test', DataTypes.TEXT, false, null, 5),
      );
      columns.push(
        FeatureColumn.createColumn(8, 'test_blob_limited.test', DataTypes.BLOB, false, null, 7),
      );
      columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
      columns.push(FeatureColumn.createColumn(2, 'test_text.test', DataTypes.TEXT, false, ''));
      columns.push(FeatureColumn.createColumn(3, 'test_real.test', DataTypes.REAL, false, null));
      columns.push(FeatureColumn.createColumn(4, 'test_boolean.test', DataTypes.BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumn(5, 'test_blob.test', DataTypes.BLOB, false, null));
      columns.push(FeatureColumn.createColumn(6, 'test_integer.test', DataTypes.INTEGER, false, ''));

      return geopackage.createFeatureTable(tableName, geometryColumns, columns)
        .then(function(featureDao) {
          should.exist(featureDao);
          const exists = geopackage.hasFeatureTable(tableName);
          exists.should.be.equal(true);
          const results = geopackage.getFeatureTables();
          results.length.should.be.equal(1);
          results[0].should.be.equal(tableName);
          return geopackage.addGeoJSONFeatureToGeoPackage(
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
        })
        .then(function(id) {
          id.should.be.equal(1);
          return geopackage.addGeoJSONFeatureToGeoPackage(
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
        })
        .then(function(id) {
          id.should.be.equal(2);
          return geopackage.getFeature(tableName, 2);
        })
        .then(function(feature) {
          should.exist(feature);
          feature.id.should.be.equal(2);
          should.exist(feature.geometry);
          return geopackage.iterateGeoJSONFeatures(tableName);
        })
        .then(function(each) {
          let count = 0;
          // @ts-ignore
          for (const row of each) {
            count++;
          }
          count.should.be.equal(2);
        });
    });
    it('should create a feature table with a null geometry', function() {
      const columns = [];

      const tableName = 'features';

      const geometryColumns = new GeometryColumns();
      geometryColumns.table_name = tableName;
      geometryColumns.column_name = 'geometry';
      geometryColumns.geometry_type_name = 'GEOMETRY';
      geometryColumns.z = 0;
      geometryColumns.m = 0;

      columns.push(FeatureColumn.createPrimaryKeyColumnWithIndexAndName(0, 'id'));
      columns.push(
        FeatureColumn.createColumn(7, 'test_text_limited.test', DataTypes.TEXT, false, null, 5),
      );
      columns.push(
        FeatureColumn.createColumn(8, 'test_blob_limited.test', DataTypes.BLOB, false, null, 7),
      );
      columns.push(FeatureColumn.createGeometryColumn(1, 'geometry', 'GEOMETRY', false, null));
      columns.push(FeatureColumn.createColumn(2, 'test_text.test', DataTypes.TEXT, false, ''));
      columns.push(FeatureColumn.createColumn(3, 'test_real.test', DataTypes.REAL, false, null));
      columns.push(FeatureColumn.createColumn(4, 'test_boolean.test', DataTypes.BOOLEAN, false, null));
      columns.push(FeatureColumn.createColumn(5, 'test_blob.test', DataTypes.BLOB, false, null));
      columns.push(FeatureColumn.createColumn(6, 'test_integer.test', DataTypes.INTEGER, false, ''));

      return geopackage.createFeatureTable(tableName, geometryColumns, columns)
        .then(function(featureDao) {
          should.exist(featureDao);
          const exists = geopackage.hasFeatureTable(tableName);
          exists.should.be.equal(true);
          const results = geopackage.getFeatureTables();
          results.length.should.be.equal(1);
          results[0].should.be.equal(tableName);
          return geopackage.addGeoJSONFeatureToGeoPackage(
            {
              type: 'Feature',
              properties: {
                'test_text_limited.test': 'test',
              },
              geometry: null,
            },
            tableName,
          );
        })
        .then(function(id) {
          id.should.be.equal(1);
          return geopackage.addGeoJSONFeatureToGeoPackage(
            {
              type: 'Feature',
              properties: {
                'test_text_limited.test': 'test',
              },
              geometry: null
            },
            tableName,
          );
        })
        .then(function(id) {
          id.should.be.equal(2);
          return geopackage.getFeature(tableName, 2);
        })
        .then(function(feature) {
          should.exist(feature);
          feature.id.should.be.equal(2);
          should.exist(feature.geometry);
          return geopackage.iterateGeoJSONFeatures(tableName);
        })
        .then(function(each) {
          let count = 0;
          // @ts-ignore
          for (const row of each) {
            count++;
          }
          count.should.be.equal(2);
        });
    });
    it('should create a tile table', function() {
      // @ts-ignore
      const columns = [];

      const tableName = 'tiles';

      const contentsBoundingBox = new BoundingBox(-180, 180, -80, 80);
      const contentsSrsId = 4326;
      const tileMatrixSetBoundingBox = new BoundingBox(-180, 180, -80, 80);
      const tileMatrixSetSrsId = 4326;
      return geopackage
        .createTileTableWithTableName(
          tableName,
          contentsBoundingBox,
          contentsSrsId,
          tileMatrixSetBoundingBox,
          tileMatrixSetSrsId,
        )
        .then(function(tileMatrixSet) {
          should.exist(tileMatrixSet);
          const exists = geopackage.hasTileTable('tiles');
          exists.should.be.equal(true);
          const tables = geopackage.getTileTables();
          tables.length.should.be.equal(1);
          tables[0].should.be.equal('tiles');
        });
    });

    it('should create a standard web mercator tile table with the default tile size', function() {
      const tableName = 'tiles_web_mercator';
      const contentsBounds = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const matrixSetBounds = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      // @ts-ignore
      return geopackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBounds,
        contentsSrsId,
        matrixSetBounds,
        tileMatrixSetSrsId,
        0,
        3,
      ).then(function(matrixSet) {
        matrixSet.table_name.should.equal(tableName);
        matrixSet.srs_id.should.equal(3857);
        matrixSet.min_x.should.equal(matrixSetBounds.minLongitude);
        matrixSet.max_x.should.equal(matrixSetBounds.maxLongitude);
        matrixSet.min_y.should.equal(matrixSetBounds.minLatitude);
        matrixSet.max_y.should.equal(matrixSetBounds.maxLatitude);

        const dbMatrixSet = geopackage.tileMatrixSetDao.queryForId(tableName);
        dbMatrixSet.should.deep.equal(matrixSet);

        const matrixDao = geopackage.tileMatrixDao;
        const matrices = matrixDao.queryForAll();

        matrices.length.should.equal(4);
        matrices.forEach(matrix => {
          matrix.tile_width.should.equal(256);
          matrix.tile_height.should.equal(256);
        });
      });
    });

    it('should create a standard web mercator tile table with a custom tile size', function() {
      const tableName = 'custom_tile_size';
      const contentsBounds = new BoundingBox(-31644.9297, 6697565.2924, 4127.5995, 6723706.7561);
      const matrixSetBounds = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const tileSize = 320;

      return geopackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBounds,
        3857,
        matrixSetBounds,
        3857,
        9,
        13,
        tileSize,
      ).then(function(matrixSet) {
        matrixSet.table_name.should.equal(tableName);
        matrixSet.srs_id.should.equal(3857);
        matrixSet.min_x.should.equal(matrixSetBounds.minLongitude);
        matrixSet.max_x.should.equal(matrixSetBounds.maxLongitude);
        matrixSet.min_y.should.equal(matrixSetBounds.minLatitude);
        matrixSet.max_y.should.equal(matrixSetBounds.maxLatitude);

        const dbMatrixSet = geopackage.tileMatrixSetDao.queryForId(tableName);
        dbMatrixSet.should.deep.equal(matrixSet);

        const matrixDao = geopackage.tileMatrixDao;
        const matrices = matrixDao.queryForAll();

        matrices.length.should.equal(5);
        matrices.forEach(matrix => {
          matrix.tile_width.should.equal(tileSize);
          matrix.tile_height.should.equal(tileSize);
        });
      });
    });

    it('should add a tile to the tile table', function(done) {
      const tableName = 'tiles_web_mercator_2';
      const contentsBoundingBox = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const tileMatrixSetBoundingBox = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      // @ts-ignore
      geopackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
        0,
        0,
      ).then(async function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        // @ts-ignore
        const tileData = await loadTile(tilePath);
        const result = geopackage.addTile(tileData, tableName, 0, 0, 0);
        result.should.be.equal(1);
        const tileRow = geopackage.getTileFromTable(tableName, 0, 0, 0);
        // @ts-ignore
        testSetup.diffImages(tileRow.tileData, tilePath, function(err, equal) {
          equal.should.be.equal(true);
          done();
        });
      });
    });

    it('should add a tile to the tile table and get it via xyz', function(done) {
      // @ts-ignore
      const columns = [];

      const tableName = 'tiles_web_mercator_3';

      const contentsBoundingBox = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const tileMatrixSetBoundingBox = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      // @ts-ignore
      geopackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
        0,
        0,
      ).then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        // @ts-ignore
        fs.readFile(tilePath, function(err, tile) {
          const result = geopackage.addTile(tile, tableName, 0, 0, 0);
          result.should.be.equal(1);
          geopackage.xyzTile(tableName, 0, 0, 0, 256, 256).then(function(tile) {
            // @ts-ignore
            testSetup.diffImages(tile, tilePath, function(err, equal) {
              equal.should.be.equal(true);
              done();
            });
          });
        });
      });
    });

    it('should add a tile to the tile table and get it into a canvas via xyz', function(done) {
      // @ts-ignore
      const columns = [];

      const tableName = 'tiles_web_mercator_4';

      const contentsBoundingBox = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const contentsSrsId = 3857;
      const tileMatrixSetBoundingBox = new BoundingBox(
        -20037508.342789244,
        20037508.342789244,
        -20037508.342789244,
        20037508.342789244,
      );
      const tileMatrixSetSrsId = 3857;

      // @ts-ignore
      geopackage.createStandardWebMercatorTileTable(
        tableName,
        contentsBoundingBox,
        contentsSrsId,
        tileMatrixSetBoundingBox,
        tileMatrixSetSrsId,
        0,
        0,
      ).then(function(tileMatrixSet) {
        should.exist(tileMatrixSet);
        // @ts-ignore
        fs.readFile(tilePath, function(err, tile) {
          const result = geopackage.addTile(tile, tableName, 0, 0, 0);
          result.should.be.equal(1);
          let canvas;
          if (typeof process !== 'undefined' && process.version) {
            const Canvas = require('canvas');
            canvas = Canvas.createCanvas(256, 256);
          } else {
            canvas = document.createElement('canvas');
          }
          geopackage.xyzTile(tableName, 0, 0, 0, 256, 256, canvas)
            // @ts-ignore
            .then(function(tile) {
              // @ts-ignore
              testSetup.diffCanvas(canvas, tilePath, function(err, equal) {
                equal.should.be.equal(true);
                done();
              });
            });
        });
      });
    });
  });
});
