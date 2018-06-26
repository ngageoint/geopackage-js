/**
 * GeoPackage module.
 * @module GeoPackage
 */

var wkx = require('wkx')
  , reproject = require('reproject')
  , path = require('path')
  , SQL = require('sql.js')
  , async = require('async')
  , fs = require('fs');

var GeoPackageManager = require('./lib/geoPackageManager')
  , GeoPackage = require('./lib/geoPackage')
  , GeoPackageTileRetriever = require('./lib/tiles/retriever')
  , GeoPackageConnection = require('./lib/db/geoPackageConnection')
  , BoundingBox = require('./lib/boundingBox')
  , GeometryData = require('./lib/geom/geometryData')
  , TableCreator = require('./lib/db/tableCreator')
  , TileBoundingBoxUtils = require('./lib/tiles/tileBoundingBoxUtils')
  , FeatureTile = require('./lib/tiles/features')
  , FeatureTableIndex = require('./lib/extension/index/featureTableIndex');

var proj4Defs = require('./lib/proj4Defs');
module.exports.proj4Defs = proj4Defs;
module.exports.GeoPackageTileRetriever = GeoPackageTileRetriever;
module.exports.GeoPackageConnection = GeoPackageConnection;
module.exports.GeoPackageManager = GeoPackageManager;

/**
 * Open a GeoPackage at the path specified
 * @param  {String}   gppath   path where the GeoPackage exists
 * @param  {Function} callback called with an error and the GeoPackage object if opened
 */
module.exports.openGeoPackage = function(gppath, callback) {
  GeoPackageManager.open(gppath, callback);
};

/**
 * Open a GeoPackage from the byte array
 * @param  {Uint8Array}   array    Array of GeoPackage bytes
 * @param  {Function} callback called with an error if it occurred and the open GeoPackage object
 */
module.exports.openGeoPackageByteArray = function(array, callback) {
  var db = new SQL.Database(array);
  GeoPackageConnection.connectWithDatabase(db, function(err, connection) {
    var geoPackage = new GeoPackage('', '', connection);
    callback(null, geoPackage);
  });
};

/**
 * Creates a GeoPackage file at the path specified in node or opens an in memory GeoPackage on the browser
 * @param  {String}   gppath   path to GeoPackage fileType
 * @param  {Function} callback called with an error if one occurred and the open GeoPackage object
 */
module.exports.createGeoPackage = function(gppath, callback) {
  if (!callback) {
    callback = gppath;
    gppath = undefined;
  }
  async.series([
    function(callback) {
      if (typeof(process) !== 'undefined' && process.version && gppath) {
        fs.mkdir(path.dirname(gppath), function() {
          fs.open(gppath, 'w', callback);
        });
      } else {
        callback();
      }
    }
  ], function() {
    GeoPackageManager.create(gppath, function(err, geopackage) {
      var tc = new TableCreator(geopackage);
      tc.createRequired(function(err) {
        callback(null, geopackage);
      });
    });
  });
};

module.exports.TileColumn = require('./lib/tiles/user/tileColumn');
module.exports.BoundingBox = require('./lib/boundingBox');
module.exports.TileUtilities = require('./lib/tiles/creator/tileUtilities');

module.exports.createTileTable = function(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, callback) {
  geopackage.createTileTableWithTableName(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, callback);
};

module.exports.createStandardWebMercatorTileTable = function(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, minZoom, maxZoom, callback) {
  module.exports.createTileTable(geopackage, tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, function(err, tileMatrixSet) {
    geopackage.createStandardWebMercatorTileMatrix(tileMatrixSetBoundingBox, tileMatrixSet, minZoom, maxZoom, function(err, result) {
      callback(err, tileMatrixSet);
    });
  });
}

/**
 * Adds a tile to the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   tile       Byte array or Buffer containing the tile bytes
 * @param  {String}   tableName  Table name to add the tile to
 * @param  {Number}   zoom       zoom level of this tile
 * @param  {Number}   tileRow    row of this tile
 * @param  {Number}   tileColumn column of this tile
 * @param  {Function} callback   called with an eror if one occurred and the inserted row
 */
module.exports.addTileToGeoPackage = function(geopackage, tile, tableName, zoom, tileRow, tileColumn, callback) {
  geopackage.addTile(tile, tableName, zoom, tileRow, tileColumn, callback);
};

module.exports.FeatureColumn = require('./lib/features/user/featureColumn');
module.exports.GeometryColumns = require('./lib/features/columns').GeometryColumns;
module.exports.DataColumns = require('./lib/dataColumns').DataColumns;
module.exports.DataTypes = require('./lib/db/dataTypes');

module.exports.createFeatureTable = function(geopackage, tableName, geometryColumn, featureColumns, callback) {
  module.exports.createFeatureTableWithDataColumns(geopackage, tableName, geometryColumn, featureColumns, null, callback);
};

module.exports.createFeatureTableWithDataColumns = function(geopackage, tableName, geometryColumn, featureColumns, dataColumns, callback) {
  var boundingBox = new BoundingBox(-180, 180, -90, 90);
  module.exports.createFeatureTableWithDataColumnsAndBoundingBox(geopackage, tableName, geometryColumn, featureColumns, dataColumns, boundingBox, 4326, callback);
};

module.exports.createFeatureTableWithDataColumnsAndBoundingBox = function(geopackage, tableName, geometryColumn, featureColumns, dataColumns, boundingBox, boundingBoxSrsId, callback) {
  geopackage.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumn, boundingBox, boundingBoxSrsId, featureColumns, dataColumns, function(err, result) {
    geopackage.getFeatureDaoWithTableName(tableName, callback);
  });
};

/**
 * Adds a GeoJSON feature to the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   feature    GeoJSON feature to add
 * @param  {String}   tableName  Table name to add the tile to
 * @param  {Function} callback   called with an error if one occurred and the inserted row
 */
module.exports.addGeoJSONFeatureToGeoPackage = function(geopackage, feature, tableName, callback) {
  geopackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
    featureDao.getSrs(function(err, srs) {
      var featureRow = featureDao.newRow();
      var geometryData = new GeometryData();
      geometryData.setSrsId(srs.srs_id);
      var featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
      var geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
      geometryData.setGeometry(geometry);
      featureRow.setGeometry(geometryData);
      for (var propertyKey in feature.properties) {
        if (feature.properties.hasOwnProperty(propertyKey)) {
          featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
        }
      }

      featureDao.create(featureRow, callback);
    });
  });
};

/**
 * Adds a GeoJSON feature to the GeoPackage and updates the FeatureTableIndex extension if it exists
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {object}   feature    GeoJSON feature to add
 * @param  {String}   tableName  Table name to add the tile to
 * @param  {Function} callback   called with an error if one occurred and the inserted row
 */
module.exports.addGeoJSONFeatureToGeoPackageAndIndex = function(geopackage, feature, tableName, callback) {
  geopackage.getFeatureDaoWithTableName(tableName, function(err, featureDao) {
    featureDao.getSrs(function(err, srs) {
      var featureRow = featureDao.newRow();
      var geometryData = new GeometryData();
      geometryData.setSrsId(srs.srs_id);
      var featureGeometry = typeof feature.geometry === 'string' ? JSON.parse(feature.geometry) : feature.geometry;
      var geometry = wkx.Geometry.parseGeoJSON(featureGeometry);
      geometryData.setGeometry(geometry);
      featureRow.setGeometry(geometryData);
      for (var propertyKey in feature.properties) {
        if (feature.properties.hasOwnProperty(propertyKey)) {
          featureRow.setValueWithColumnName(propertyKey, feature.properties[propertyKey]);
        }
      }

      featureDao.create(featureRow, function(err, id) {
        var fti = new FeatureTableIndex(geopackage.getDatabase(), featureDao);
        fti.getTableIndex(function(err, tableIndex) {
          if (!tableIndex) return callback(null, id);
          fti.indexRow(tableIndex, id, geometryData, function(err) {
            fti.updateLastIndexed(tableIndex, function() {
              return callback(err, id);
            });
          });
        });
      });
    });
  });
};

/**
 * Queries for GeoJSON features in a feature tables
 * @param  {String}   geoPackagePath  path to the GeoPackage file
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} callback    Caled with err, featureArray
 */
module.exports.queryForGeoJSONFeaturesInTableFromPath = function(geoPackagePath, tableName, boundingBox, callback) {
  GeoPackageManager.open(geoPackagePath, function(err, geoPackage) {
    geoPackage.queryForGeoJSONFeaturesInTable(tableName, boundingBox, function(err, features) {
      geoPackage.close();
      callback(err, features);
    });
  });
}

/**
 * Queries for GeoJSON features in a feature tables
 * @param  {GeoPackage}   geoPackage  open GeoPackage object
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} callback    Caled with err, featureArray
 */
module.exports.queryForGeoJSONFeaturesInTable = function(geoPackage, tableName, boundingBox, callback) {
  geoPackage.queryForGeoJSONFeaturesInTable(tableName, boundingBox, callback);
}

/**
 * Iterates GeoJSON features in a feature table that matches the bounding box
 * @param  {GeoPackage}   geoPackage  open GeoPackage object
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} rowCallback    Caled with err, and GeoJSON feature
 * @param  {Function} doneCallback    Caled with err if one occurred
 */
module.exports.iterateGeoJSONFeaturesInTableWithinBoundingBox = function(geoPackage, tableName, boundingBox, rowCallback, doneCallback) {
  geoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox, rowCallback, doneCallback);
}


/**
 * Iterates GeoJSON features in a feature table that matches the bounding box
 * @param  {String}   geoPackagePath  path to the GeoPackage file
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} rowCallback    Caled with err, and GeoJSON feature
 * @param  {Function} doneCallback    Caled with err if one occurred
 */
module.exports.iterateGeoJSONFeaturesFromPathInTableWithinBoundingBox = function(geoPackagePath, tableName, boundingBox, rowCallback, doneCallback) {
  GeoPackageManager.open(geoPackagePath, function(err, geoPackage) {
    geoPackage.iterateGeoJSONFeaturesInTableWithinBoundingBox(tableName, boundingBox, rowCallback, doneCallback);
  });
}

/**
 * Gets the tables from the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and an object containing a 'features' property which is an array of feature table names and a 'tiles' property which is an array of tile table names
 */
module.exports.getTables = function(geopackage, callback) {
  var tables = {};
  geopackage.getFeatureTables(function(err, featureTables) {
    tables.features = featureTables;
    geopackage.getTileTables(function(err, tileTables) {
      tables.tiles = tileTables;
      callback(null, tables);
    });
  });
};

/**
 * Gets the feature tables from the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and the array of feature table names
 */
module.exports.getFeatureTables = function(geopackage, callback) {
  geopackage.getFeatureTables(callback);
};

/**
 * Checks if the feature table exists in the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String} featureTableName name of the table to query for
 * @param  {Function} callback   called with an error if one occurred and true or false for the existence of the table
 */
module.exports.hasFeatureTable = function(geopackage, featureTableName, callback) {
  geopackage.getFeatureTables(function(err, tables) {
    return callback(err, tables && tables.indexOf(featureTableName) != -1);
  });
};

/**
 * Iterate GeoJSON features from table
 * @param  {GeoPackage} geopackage      open GeoPackage object
 * @param  {String} table           Table name to Iterate
 * @param  {Function} featureCallback called with an error if one occurred and the next GeoJSON feature in the table
 * @param  {Function} doneCallback    called when all rows are complete
 */
module.exports.iterateGeoJSONFeaturesFromTable = function(geopackage, table, featureCallback, doneCallback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    if (err) {
      return doneCallback(err);
    }
    featureDao.getSrs(function(err, srs) {
      featureDao.queryForEach(function(err, row, rowDone) {
        var currentRow = featureDao.getFeatureRow(row, srs);
        featureCallback(err, parseFeatureRowIntoGeoJSON(currentRow, srs), rowDone);
      }, doneCallback);
    });
  });
};

/**
 * Gets a GeoJSON feature from the table by id
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table to get the feature from
 * @param  {Number}   featureId  ID of the feature
 * @param  {Function} callback   called with an error if one occurred and the GeoJSON feature
 */
module.exports.getFeature = function(geopackage, table, featureId, callback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    featureDao.getSrs(function(err, srs) {
      featureDao.queryForIdObject(featureId, function(err, object, feature) {
        var currentRow;
        if (feature) {
          currentRow = featureDao.getFeatureRow(feature);
          callback(null, parseFeatureRowIntoGeoJSON(currentRow, srs));
        } else {
          featureDao.queryForEqWithFieldAndValue('_feature_id', featureId, function(err, feature, rowDone) {
            if (feature) {
              currentRow = featureDao.getFeatureRow(feature);
              rowDone();
            } else {
              featureDao.queryForEqWithFieldAndValue('_properties_id', featureId, function(err, feature, rowDone) {
                if (feature) {
                  currentRow = featureDao.getFeatureRow(feature);
                  rowDone();
                } else {
                  callback();
                }
              });
            }
          }, function() {
            callback(null, parseFeatureRowIntoGeoJSON(currentRow, srs));
          });
        }
      });
    });
  });
};

function parseFeatureRowIntoGeoJSON(featureRow, srs) {
  var geoJson = {
    type: 'Feature',
    properties: {}
  };
  var geometry = featureRow.getGeometry();
  if (geometry && geometry.geometry) {
    var geom = geometry.geometry;
    var geoJsonGeom = geometry.geometry.toGeoJSON();
    if (srs.definition && srs.definition !== 'undefined' && (srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id) != 'EPSG:4326') {
      geoJsonGeom = reproject.reproject(geoJsonGeom, srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id, 'EPSG:4326');
    }
    geoJson.geometry = geoJsonGeom;
  }

  for (var key in featureRow.values) {
    if(featureRow.values.hasOwnProperty(key) && key != featureRow.getGeometryColumn().name && key != 'id') {
      if (key.toLowerCase() == '_feature_id') {
        geoJson.id = featureRow.values[key];
      } else if (key.toLowerCase() == '_properties_id') {
        geoJson.properties[key.substring(12)] = featureRow.values[key];
      } else {
        geoJson.properties[key] = featureRow.values[key];
      }
    } else if (featureRow.getGeometryColumn().name === key) {
      // geoJson.properties[key] = geometry && !geometry.geometryError ? 'Valid' : geometry.geometryError;
    }
  }
  geoJson.id = geoJson.id || featureRow.getId();
  return geoJson;
}

/**
 * Gets the tile table names from the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and the array of tile table names
 */
module.exports.getTileTables = function(geopackage, callback) {
  geopackage.getTileTables(callback);
};

/**
 * Checks if the tile table exists in the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String} tileTableName name of the table to query for
 * @param  {Function} callback   called with an error if one occurred and true or false for the existence of the table
 */
module.exports.hasTileTable = function(geopackage, tileTableName, callback) {
  geopackage.getTileTables(function(err, tables) {
    return callback(err, tables && tables.indexOf(tileTableName) != -1);
  });
};

/**
 * Gets a tile from the specified table
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table to get the tile from
 * @param  {Number}   zoom       zoom level of the tile
 * @param  {Number}   tileRow    row of the tile
 * @param  {Number}   tileColumn column of the tile
 * @param  {Function} callback   called with an error if one occurred and the TileRow object
 */
module.exports.getTileFromTable = function(geopackage, table, zoom, tileRow, tileColumn, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err) return callback();
    tileDao.queryForTile(tileColumn, tileRow, zoom, callback);
  });
};

/**
 * Gets the tiles in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the tile table
 * @param  {Number}   zoom       Zoom of the tiles to query for
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 * @param  {Function} callback   called with an error if one occurred and a tiles object describing the tiles
 */
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

/**
 * Gets the tiles in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the tile table
 * @param  {Number}   zoom       Zoom of the tiles to query for
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 * @param  {Function} callback   called with an error if one occurred and a tiles object describing the tiles
 */
module.exports.getTilesInBoundingBoxWebZoom = function(geopackage, table, webZoom, west, east, south, north, callback) {
  var tiles = {};

  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err) {
      return callback();
    }
    if (webZoom < tileDao.minWebZoom || webZoom > tileDao.maxWebZoom) {
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

      var zoom = tileDao.webZoomToGeoPackageZoom(webZoom);

      var tms = tileDao.tileMatrixSet;
      var tm = tileDao.getTileMatrixWithZoomLevel(zoom);
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

module.exports.getFeatureTileFromXYZ = function(geopackage, table, x, y, z, width, height, callback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    if (err || !featureDao) return callback(err);
    var ft = new FeatureTile(featureDao, width, height);
    ft.drawTile(x, y, z, callback);
  });
}

module.exports.indexGeoPackage = function(geopackage, callback) {
  geopackage.getFeatureTables(function(err, tables) {
    async.eachSeries(tables, function(table, callback) {
      module.exports.indexFeatureTable(geopackage, table, callback);
    }, callback);
  });
}

module.exports.indexFeatureTable = function(geopackage, table, callback) {
  geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
    var fti = new FeatureTableIndex(geoPackage.getDatabase(), featureDao);
    fti.getTableIndex(function(err, tableIndex) {
      if (tableIndex) {
        return callback(null, true);
      }
      fti.index(function() {
        console.log('progress', arguments);
      }, function(err) {
        return callback(null, !err);
      });
    });
  });
}

/**
 * Gets the features in the EPSG:4326 bounding box
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the feature table
 * @param  {Number}   west       EPSG:4326 western boundary
 * @param  {Number}   east       EPSG:4326 eastern boundary
 * @param  {Number}   south      EPSG:4326 southern boundary
 * @param  {Number}   north      EPSG:4326 northern boundary
 * @param  {Function} callback   called with an error if one occurred and a features array
 */
module.exports.getFeaturesInBoundingBox = function(geopackage, table, west, east, south, north, callback) {
  module.exports.indexFeatureTable(geopackage, table, function() {
    geopackage.getFeatureDaoWithTableName(table, function(err, featureDao) {
      if (err || !featureDao) return callback(err);
      var features = [];
      var bb = new BoundingBox(west, east, south, north);
      featureDao.queryIndexedFeaturesWithBoundingBox(bb, function(err, feature, rowDoneCallback) {
        feature.push(feature);
        rowDoneCallback();
      }, function(err) {
        callback(err, features);
      });
    });
  });
}

/**
 * Gets a tile image for an XYZ tile pyramid location
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   x          x index of the tile
 * @param  {Number}   y          y index of the tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @param  {Function} callback   Called with an error if one occurred and the tile buffer
 */
module.exports.getTileFromXYZ = function(geopackage, table, x, y, z, width, height, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    if (err || !tileDao) return callback(err);
    var retriever = new GeoPackageTileRetriever(tileDao, width, height);
    retriever.getTile(x, y, z, callback);
  });
};

/**
 * Draws an XYZ tile pyramid location into the provided canvas
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String}   table      name of the table containing the tiles
 * @param  {Number}   x          x index of the tile
 * @param  {Number}   y          y index of the tile
 * @param  {Number}   z          zoom level of the tile
 * @param  {Number}   width      width of the resulting tile
 * @param  {Number}   height     height of the resulting tile
 * @param  {Canvas}   canvas     canvas element to draw the tile into
 * @param  {Function} callback   Called with an error if one occurred
 */
module.exports.drawXYZTileInCanvas = function(geopackage, table, x, y, z, width, height, canvas, callback) {
  geopackage.getTileDaoWithTableName(table, function(err, tileDao) {
    var retriever = new GeoPackageTileRetriever(tileDao, width, height);
    retriever.drawTileIn(x, y, z, canvas, callback);
  });
};
