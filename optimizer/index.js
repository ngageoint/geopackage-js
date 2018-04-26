var GeoPackageAPI = require('@ngageoint/geopackage')
  , GeoPackageTileRetriever = GeoPackageAPI.GeoPackageTileRetriever
  , BoundingBox = GeoPackageAPI.BoundingBox
  , fs = require('fs')
  , async = require('async')
  , chalk = require('chalk')
  , proj4 = require('proj4')
  , xyzTileUtils = require('./lib/xyz-tile-utils');

proj4 = 'default' in proj4 ? proj4['default'] : proj4; // Module loading hack

module.exports = function(inputGeoPackage, outputGeoPackage, callback) {
  async.series({
    tileTables: inputGeoPackage.getTileTables.bind(inputGeoPackage),
    featureTables: inputGeoPackage.getFeatureTables.bind(inputGeoPackage)
  }, function(err, results) {
    tables = results;
    var tileTables = tables.tileTables;
    if (tileTables) {
      outputGeoPackage.getSpatialReferenceSystemDao().createWebMercator(function(err, result) {
        async.eachSeries(tileTables,
          function(table, callback) {
            inputGeoPackage.getTileDaoWithTableName(table, function(err, dao) {
              processTileTable(inputGeoPackage, outputGeoPackage, dao, callback);
            });
          },
          callback
        );
      });
    }
  });
}

function processTileTable(inputGeoPackage, outputGeoPackage, tableDao, callback) {
  outputTileTableInfo(inputGeoPackage, tableDao, function(err, info) {

    var minZoom = info.minZoom;
    var maxZoom = info.maxZoom;
    var data = tableDao;
    var projection = info.contents.srs.organization + ':' + info.contents.srs.organization_coordsys_id;
    var tableName = info.tableName;

    var sw = proj4(projection, 'EPSG:4326', [info.contents.minX, info.contents.minY]);
    var ne = proj4(projection, 'EPSG:4326', [info.contents.maxX, info.contents.maxY]);

    var tileMatrixSet;
    var tileMatrixSetBoundingBox = new BoundingBox(-20037508.342789244, 20037508.342789244, -20037508.342789244, 20037508.342789244);
    var tileMatrixSetSrsId = 3857;

    var sw3857 = proj4(projection, 'EPSG:3857', [info.contents.minX, info.contents.minY]);
    var ne3857 = proj4(projection, 'EPSG:3857', [info.contents.maxX, info.contents.maxY]);

    var contentsBoundingBox = new BoundingBox(sw3857[0], ne3857[0], sw3857[1], ne3857[1]);
    var contentsSrsId = 3857;
    outputGeoPackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, result) {
      tileMatrixSet = result;
      outputGeoPackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, function(err, result) {
        xyzTileUtils.iterateAllTilesInExtent([sw[0], sw[1], ne[0], ne[1]], minZoom, maxZoom, data,
          function processTileCallback(tile, done) {
            var z = tile.z;
            var x = tile.x;
            var y = tile.y;
            var tileDao = tile.data;
            var retriever = new GeoPackageTileRetriever(tileDao, 256, 256);
            retriever.getTile(x, y, z, function(err, tileData) {
              outputGeoPackage.addTile(tileData, tableName, z, y, x, function(err, result) {
                if (!err) {
                  console.log('Wrote tile z: %s y: %s x: %s', z, y, x);
                }
                done(err);
              });
            });
        }, function zoomCompleteCallback(zoomLevel, callback) {
          console.log('Zoom level %s complete', zoomLevel);
          callback();
        }, function completeCallback() {
          callback();
        });
      });
    });
  });
}

function outputTileTableInfo(geoPackage, dao, callback) {
  geoPackage.getInfoForTable(dao, function(err, info) {
    console.log('\n'+chalk.blue(info.tableName + ' Tile Table Information'));
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

    console.log('\n\t'+chalk.green('Tile Matrix Spatial Reference System'));
    console.log('\t'+chalk.green('SRS Name: ') + info.srs.count);
    console.log('\t'+chalk.green('SRS ID: ') + info.srs.id);
    console.log('\t'+chalk.green('Organization: ') + info.srs.organization);
    console.log('\t'+chalk.green('Coordsys ID: ') + info.srs.organization_coordsys_id);
    console.log('\t'+chalk.green('Definition: ') + info.srs.definition);
    console.log('\t'+chalk.green('Description: ') + info.srs.description);

    console.log('\n'+chalk.cyan('Contents'));
    console.log(chalk.cyan('Table Name: ') + info.contents.tableName);
    console.log(chalk.cyan('Data Type: ') + info.contents.dataType);
    console.log(chalk.cyan('Identifier: ') + info.contents.identifier);
    console.log(chalk.cyan('Description: ') + info.contents.description);
    console.log(chalk.cyan('Last Change: ') + info.contents.lastChange);
    console.log(chalk.cyan('Min X: ') + info.contents.minX);
    console.log(chalk.cyan('Min Y : ') + info.contents.minY);
    console.log(chalk.cyan('Max X: ') + info.contents.maxX);
    console.log(chalk.cyan('Max Y: ') + info.contents.maxY);

    console.log('\n\t'+chalk.cyan('Contents Spatial Reference System'));
    console.log('\t'+chalk.cyan('SRS Name: ') + info.contents.srs.count);
    console.log('\t'+chalk.cyan('SRS ID: ') + info.contents.srs.id);
    console.log('\t'+chalk.cyan('Organization: ') + info.contents.srs.organization);
    console.log('\t'+chalk.cyan('Coordsys ID: ') + info.contents.srs.organization_coordsys_id);
    console.log('\t'+chalk.cyan('Definition: ') + info.contents.srs.definition);
    console.log('\t'+chalk.cyan('Description: ') + info.contents.srs.description);
    callback(null, info);
  });
}
