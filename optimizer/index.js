let GeoPackageAPI = require('@ngageoint/geopackage'),
  GeoPackageTileRetriever = GeoPackageAPI.GeoPackageTileRetriever,
  BoundingBox = GeoPackageAPI.BoundingBox,
  chalk = require('chalk'),
  proj4 = require('proj4'),
  xyzTileUtils = require('./lib/xyz-tile-utils');

proj4 = 'default' in proj4 ? proj4['default'] : proj4; // Module loading hack

module.exports = {
  optimize: optimize,
  processTileTable: processTileTable,
  copyFeatures: copyFeatures,
  indexTable: indexTable,
};

function optimize(options) {
  const inputGeoPackage = options.inputGeoPackage;
  const outputGeoPackage = options.outputGeoPackage;
  const same = options.same;
  const progress = options.progress || function() {};
  const tileTables = inputGeoPackage.getTileTables() || [];
  const featureTables = inputGeoPackage.getFeatureTables() || [];
  outputGeoPackage.getSpatialReferenceSystemDao().createWebMercator();

  if (!same) {
    return tileTables
      .reduce(function(sequence, table) {
        return sequence.then(function() {
          const tileDao = inputGeoPackage.getTileDao(table);
          return processTileTable({
            inputGeoPackage: inputGeoPackage,
            outputGeoPackage: outputGeoPackage,
            tableDao: tileDao,
            tableName: table,
          });
        });
      }, Promise.resolve())
      .then(function() {
        return featureTables.reduce(function(sequence, table) {
          return sequence.then(function() {
            return copyFeatures({
              inputGeoPackage: inputGeoPackage,
              outputGeoPackage: outputGeoPackage,
              tableName: table,
            }).then(indexTable);
          });
        }, Promise.resolve());
      });
  } else {
    return tileTables
      .reduce(function(sequence, table) {
        return sequence.then(function() {
          const tileDao = inputGeoPackage.getTileDao(table);
          let count = 1;
          let name = 'tiles';
          while (tileTables.indexOf(name) !== -1) {
            name = 'tiles' + '_' + count;
            count++;
          }

          return processTileTable({
            inputGeoPackage: inputGeoPackage,
            outputGeoPackage: outputGeoPackage,
            tableDao: tileDao,
            tableName: name,
            progress: progress,
          })
            .then(function() {
              // delete the original table
              const tileDao = outputGeoPackage.getTileDao(table);
              return tileDao.dropTable();
            })
            .then(function(dropResult) {
              const tileDao = outputGeoPackage.getTileDao(name);
              return tileDao.rename(table);
              // rename the new table
            });
        });
      }, Promise.resolve())
      .then(function() {
        return featureTables.reduce(function(sequence, table) {
          return sequence.then(function() {
            const featureDao = inputGeoPackage.getFeatureDao(table);
            return indexTable(featureDao, progress);
          });
        }, Promise.resolve());
      });
  }
}

function copyFeatures(options) {
  const inputGeoPackage = options.inputGeoPackage;
  const outputGeoPackage = options.outputGeoPackage;
  const table = options.tableName;

  const featureDao = inputGeoPackage.getFeatureDao(table);
  const featureTable = featureDao.getFeatureTable();

  const geometryColumns = inputGeoPackage.geometryColumnsDao.queryForTableName(table);
  const boundingBox = featureDao.getBoundingBox();
  const srsId = featureDao.getSrs().srs_id;
  const columns = featureTable.getUserColumns().getColumns();

  return outputGeoPackage
    .createFeatureTable(table, geometryColumns, columns, boundingBox, srsId)
    .then(function() {
      const outputFeatureDao = outputGeoPackage.getFeatureDao(table);
      const featureDao = inputGeoPackage.getFeatureDao(table);

      const iterator = featureDao.queryForAll();
      for (const feature of iterator) {
        outputFeatureDao.create(featureDao.createObject(feature));
      }
      return outputFeatureDao;
    });
}

function indexTable(featureDao, progress) {
  progress = progress || function() {};
  return featureDao.featureTableIndex.rtreeIndex.create(progress);
}

function tile2lat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function processTileTable(options) {
  const inputGeoPackage = options.inputGeoPackage;
  const outputGeoPackage = options.outputGeoPackage;
  const tableDao = options.tableDao;
  const outputTableName = options.tableName;
  const progress = options.progress || function() {};

  const info = outputTileTableInfo(inputGeoPackage, tableDao);

  const minZoom = info.minZoom;
  const maxZoom = info.maxZoom;
  const data = tableDao;
  const projection = info.contents.srs.organization.toUpperCase() + ':' + info.contents.srs.organization_coordsys_id;
  const tableName = outputTableName || info.tableName;

  const sw = proj4(projection, 'EPSG:4326', [info.contents.minX, info.contents.minY]);
  const ne = proj4(projection, 'EPSG:4326', [info.contents.maxX, info.contents.maxY]);

  const totalCount = xyzTileUtils.tileCountInExtent([sw[0], sw[1], ne[0], ne[1]], minZoom, maxZoom);
  progress({
    count: 0,
    totalCount: totalCount,
    layer: tableDao.table_name,
  });

  let tileMatrixSet;
  const tileMatrixSetBoundingBox = new BoundingBox(
    -20037508.342789244,
    20037508.342789244,
    -20037508.342789244,
    20037508.342789244,
  );
  const tileMatrixSetSrsId = 3857;
  if (sw[1] < tile2lat(1, 0)) {
    sw[1] = tile2lat(1, 0);
  }
  if (ne[1] > tile2lat(0, 0)) {
    ne[1] = tile2lat(0, 0);
  }
  const sw3857 = proj4('EPSG:4326', 'EPSG:3857', sw);
  const ne3857 = proj4('EPSG:4326', 'EPSG:3857', ne);

  let tilesProcessedCount = 0;

  const contentsBoundingBox = new BoundingBox(sw3857[0], ne3857[0], sw3857[1], ne3857[1]);
  const contentsSrsId = 3857;
  return outputGeoPackage
    .createTileTableWithTableName(
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileMatrixSetBoundingBox,
      tileMatrixSetSrsId,
    )
    .then(function(result) {
      tileMatrixSet = result;
      outputGeoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom);
      return xyzTileUtils.iterateAllTilesInExtent(
        [sw[0], sw[1], ne[0], ne[1]],
        minZoom,
        maxZoom,
        data,
        function processTileCallback(x, y, z, tileDao) {
          const retriever = new GeoPackageTileRetriever(tileDao, 256, 256);
          return retriever
            .getTile(x, y, z)
            .then(function(tileData) {
              outputGeoPackage.addTile(tileData, tableName, z, y, x);
              tilesProcessedCount++;
              if (tilesProcessedCount % Math.ceil(totalCount * 0.05) === 0) {
                progress({
                  count: tilesProcessedCount,
                  totalCount: totalCount,
                  layer: tableDao.table_name,
                });
              }
            })
            .then(function() {
              return new Promise(function(resolve, reject) {
                setTimeout(function() {
                  resolve();
                });
              });
            });
        },
      );
    })
    .catch(function(err) {
      console.log('Error converting', err);
    });
}

function outputTileTableInfo(geoPackage, dao, callback) {
  const info = geoPackage.getInfoForTable(dao);
  console.log('\n' + chalk.blue(info.tableName + ' Tile Table Information'));
  console.log(chalk.blue('Total Tiles: ') + info.count);
  console.log(chalk.blue('Zoom Levels: ') + info.zoomLevels);
  console.log(chalk.blue('Min Zoom: ') + info.minZoom);
  console.log(chalk.blue('Max Zoom: ') + info.maxZoom);

  console.log('\n' + chalk.green('Tile Matrix Set Bounds'));
  console.log(chalk.green('SRS ID: ') + info.tileMatrixSet.srsId);
  console.log(chalk.green('Min X: ') + info.tileMatrixSet.minX);
  console.log(chalk.green('Min Y : ') + info.tileMatrixSet.minY);
  console.log(chalk.green('Max X: ') + info.tileMatrixSet.maxX);
  console.log(chalk.green('Max Y: ') + info.tileMatrixSet.maxY);

  console.log('\n\t' + chalk.green('Tile Matrix Spatial Reference System'));
  console.log('\t' + chalk.green('SRS Name: ') + info.srs.count);
  console.log('\t' + chalk.green('SRS ID: ') + info.srs.id);
  console.log('\t' + chalk.green('Organization: ') + info.srs.organization);
  console.log('\t' + chalk.green('Coordsys ID: ') + info.srs.organization_coordsys_id);
  console.log('\t' + chalk.green('Definition: ') + info.srs.definition);
  console.log('\t' + chalk.green('Description: ') + info.srs.description);

  console.log('\n' + chalk.cyan('Contents'));
  console.log(chalk.cyan('Table Name: ') + info.contents.tableName);
  console.log(chalk.cyan('Data Type: ') + info.contents.dataType);
  console.log(chalk.cyan('Identifier: ') + info.contents.identifier);
  console.log(chalk.cyan('Description: ') + info.contents.description);
  console.log(chalk.cyan('Last Change: ') + info.contents.lastChange);
  console.log(chalk.cyan('Min X: ') + info.contents.minX);
  console.log(chalk.cyan('Min Y : ') + info.contents.minY);
  console.log(chalk.cyan('Max X: ') + info.contents.maxX);
  console.log(chalk.cyan('Max Y: ') + info.contents.maxY);

  console.log('\n\t' + chalk.cyan('Contents Spatial Reference System'));
  console.log('\t' + chalk.cyan('SRS Name: ') + info.contents.srs.count);
  console.log('\t' + chalk.cyan('SRS ID: ') + info.contents.srs.id);
  console.log('\t' + chalk.cyan('Organization: ') + info.contents.srs.organization);
  console.log('\t' + chalk.cyan('Coordsys ID: ') + info.contents.srs.organization_coordsys_id);
  console.log('\t' + chalk.cyan('Definition: ') + info.contents.srs.definition);
  console.log('\t' + chalk.cyan('Description: ') + info.contents.srs.description);
  return info;
}
