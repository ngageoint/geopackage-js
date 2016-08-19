var wkx = require('wkx')
  , reproject = require('reproject')
  , SQL = require('sql.js');

var GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackage = require('./lib/geopackage')
  , GeoPackageTileRetriever = require('./lib/tiles/retriever')
  , GeoPackageConnection = require('./lib/db/geoPackageConnection')
  , BoundingBox = require('./lib/boundingBox')
  , TileBoundingBoxUtils = require('./lib/tiles/tileBoundingBoxUtils');

module.exports.openGeoPackage = function(gppath, callback) {
  GeoPackageManager.open(gppath, callback);
};

module.exports.openGeoPackageByteArray = function(array, callback) {
  var db = new SQL.Database(array);
  GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
    var geoPackage = new GeoPackage('', '', connection);
    callback(null, geoPackage);
  });
};

module.exports.createGeoPackage = function(gppath, callback) {
  async.series([
    function(callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        fs.mkdir(path.dirname(gppath), function() {
          fs.open(gppath, 'w', callback);
        });
      } else {
        callback();
      }
    }
  ], function() {
    GeoPackageConnection.connect(gppath, function(err, connection) {
      var geopackage = new GeoPackage(path.basename(gppath), gppath, connection);
      var tc = new TableCreator(geopackage);
      tc.createRequired(function() {
        callback(null, geopackage);
      });
    });
  });
};

module.exports.addTileToGeoPackage = function(geopackage, tile, tableName, zoom, tileRow, tileColumn, callback) {
  geopackage.addTile(tile, tableName, zoom, tileRow, tileColumn, callback);
};

module.exports.addGeoJSONFeatureToGeoPackage = function(geopackage, feature, tableName, callback) {
  geopacakge.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
    var featureRow = featureDao.newRow();
    var geometryData = new GeometryData();
    geometryData.setSrsId(4326);
    var featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
    var geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
    featureRow.setGeometry(geometry);
    for (var propertyKey in feature.properties) {
      if (feature.properties.hasOwnProperty(propertyKey)) {
        featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
      }
    }

    featureDao.create(featureRow, callback);
  });
};

module.exports.getFeatureTables = function(geopackage, callback) {
  geopackage.getFeatureTables(callback);
};

module.exports.iterateGeoJSONFeaturesFromTable = function(geopackage, table, featureCallback, doneCallback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    if (err) {
      return doneCallback();
    }
    featureDao.getSrs(function(err, srs) {
      featureDao.queryForEach(function(err, row, rowDone) {
        var currentRow = featureDao.getFeatureRow(row);
        var geometry = currentRow.getGeometry();
        if (geometry) {
          var geom = geometry.geometry;
          var geoJson = geometry.geometry.toGeoJSON();
          if (srs.definition && srs.definition !== 'undefined') {
            geoJson = reproject.reproject(geoJson, srs.organization + ':' + srs.organization_coordsys_id, 'EPSG:4326');
          }
        }
        geoJson.properties = {};
        for (var key in currentRow.values) {
          if(currentRow.values.hasOwnProperty(key) && key != currentRow.getGeometryColumn().name) {
            geoJson.properties[key] = currentRow.values[key];
          } else if (currentRow.getGeometryColumn().name === key) {
            geoJson.properties[key] = geometry ? 'Valid' : 'No Geometry';
          }
        }
        geoJson.id = currentRow.getId();
        featureCallback(err, geoJson);
        rowDone();
      }, doneCallback);
    });
  });
};

module.exports.getFeature = function(geopackage, table, featureId, callback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    featureDao.getSrs(function(err, srs) {
      featureDao.queryForIdObject(featureId, function(err, object, feature) {
        var currentRow = featureDao.getFeatureRow(feature);
        var geometry = currentRow.getGeometry();
        if (geometry) {
          var geom = geometry.geometry;
          var geoJson = geometry.geometry.toGeoJSON();
          if (srs.definition && srs.definition !== 'undefined') {
            geoJson = reproject.reproject(geoJson, srs.organization + ':' + srs.organization_coordsys_id, 'EPSG:4326');
          }
        }
        geoJson.properties = {};
        for (var key in currentRow.values) {
          if(currentRow.values.hasOwnProperty(key) && key != currentRow.getGeometryColumn().name) {
            geoJson.properties[key] = currentRow.values[key];
          } else if (currentRow.getGeometryColumn().name === key) {
            geoJson.properties[key] = geometry ? 'Valid' : 'No Geometry';
          }
        }
        geoJson.id = currentRow.getId();
        callback(null, geoJson);
      });
    });
  });
};

module.exports.getTileTables = function(geopackage, callback) {
  geopackage.getTileTables(callback);
};

module.exports.getTileFromTable = function(geopackage, table, zoom, tileRow, tileColumn, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err) return callback();
    tileDao.queryForTile(tileColumn, tileRow, zoom, callback);
  });
};

module.exports.getTilesInBoundingBox = function(geopackage, table, zoom, west, east, south, north, callback) {
  var tiles = {};

  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err) {
      return callback();
    }
    if (zoom < tileDao.minZoom || zoom > tileDao.maxZoom) {
      return callback();
    }
    tiles.columns = [];
    for (var i = 0; i < tileDao.table.columns.length; i++) {
      var column = tileDao.table.columns[i];
      tiles.columns.push({
        index: column.index,
        name: column.name,
        max: column.max,
        min: column.min,
        notNull: column.notNull,
        primaryKey: column.primaryKey
      });
    }
    tileDao.getSrs(function(err, srs) {
      tiles.srs = srs;
      tiles.tiles = [];

      var tms = tileDao.tileMatrixSet;
      var tm = tileDao.getTileMatrixWithZoomLevel(zoom);
      var mapBounds = map.getBounds();
      var mapBoundingBox = new BoundingBox(Math.max(-180, west), Math.min(east, 180), south, north);
      tiles.west = Math.max(-180, west).toFixed(2);
      tiles.east = Math.min(east, 180).toFixed(2);
      tiles.south = south.toFixed(2);
      tiles.north = north.toFixed(2);
      tiles.zoom = zoom;
      mapBoundingBox = mapBoundingBox.projectBoundingBox('EPSG:4326', tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id);

      var grid = TileBoundingBoxUtils.getTileGridWithTotalBoundingBox(tms.getBoundingBox(), tm.matrix_width, tm.matrix_height, mapBoundingBox);

      tileDao.queryByTileGrid(grid, zoom, function(err, row, rowDone) {
        var tile = {};
        tile.tableName = table;
        tile.id = row.getId();

        var tileBB = TileBoundingBoxUtils.getTileBoundingBox(tms.getBoundingBox(), tm, row.getTileColumn(), row.getTileRow());
        tile.minLongitude = tileBB.minLongitude;
        tile.maxLongitude = tileBB.maxLongitude;
        tile.minLatitude = tileBB.minLatitude;
        tile.maxLatitude = tileBB.maxLatitude;
        tile.projection = tileDao.srs.organization.toUpperCase() + ':' + tileDao.srs.organization_coordsys_id;
        tile.values = [];
        for (var i = 0; i < tiles.columns.length; i++) {
          var value = row.values[tiles.columns[i].name];
          if (tiles.columns[i].name === 'tile_data') {
            tile.values.push('data');
          } else
          if (value === null || value === 'null') {
            tile.values.push('');
          } else {
            tile.values.push(value.toString());
            tile[tiles.columns[i].name] = value;
          }
        }
        tiles.tiles.push(tile);
        rowDone();
      }, function(err) {
        callback(err, tiles);
      });
    });
  });
};

module.exports.getTileFromXYZ = function(geopackage, table, x, y, z, width, height, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    var retriever = new GeoPackageTileRetriever(tileDao, width, height);
    retriever.getTile(x, z, z, callback);
  });
};

module.exports.drawXYZTileInCanvas = function(geopackage, table, x, y, z, width, height, canvas, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    var retriever = new GeoPackageTileRetriever(tileDao, width, height);
    retriever.drawTileIn(x, y, z, canvas, callback);
  });
};
