/**
 * GeoPackage module.
 * @module geoPackage
 */

var SpatialReferenceSystemDao = require('./core/srs').SpatialReferenceSystemDao
  , GeometryColumnsDao = require('./features/columns').GeometryColumnsDao
  , FeatureDao = require('./features/user/featureDao')
  , FeatureTableReader = require('./features/user/featureTableReader')
  , ContentsDao = require('./core/contents').ContentsDao
  , Contents = require('./core/contents').Contents
  , TileMatrixSetDao = require('./tiles/matrixset').TileMatrixSetDao
  , TileMatrixSet = require('./tiles/matrixset').TileMatrixSet
  , TileMatrixDao = require('./tiles/matrix').TileMatrixDao
  , TileMatrix = require('./tiles/matrix').TileMatrix
  , TileTableReader = require('./tiles/user/tileTableReader')
  , TileDao = require('./tiles/user/tileDao')
  , TileTable = require('./tiles/user/tileTable')
  , TileBoundingBoxUtils = require('./tiles/tileBoundingBoxUtils')
  , TableCreator = require('./db/tableCreator')
  , UserTable = require('./user/userTable')
  , FeatureTable = require('./features/user/featureTable')
  , DataColumnsDao = require('./dataColumns').DataColumnsDao
  , DataColumnConstraintsDao = require('./dataColumnConstraints').DataColumnConstraintsDao
  , MetadataDao = require('./metadata').MetadataDao
  , MetadataReferenceDao = require('./metadata/reference').MetadataReferenceDao
  , ExtensionDao = require('./extension').ExtensionDao
  , TableIndexDao = require('./extension/index/tableIndex').TableIndexDao
  , GeometryIndexDao = require('./extension/index/geometryIndex').GeometryIndexDao
  , DataTypes = require('./db/dataTypes');

var async = require('async')
  , proj4 = require('proj4')
  , toArray = require('stream-to-array');

proj4 = 'default' in proj4 ? proj4['default'] : proj4; // Module loading hack

var defs = require('./proj4Defs');
for (var name in defs) {
  if (defs[name]) {
    proj4.defs(name, defs[name]);
  }
}

/**
 * GeoPackage database
 * @class GeoPackage
 */
var GeoPackage = function(name, path, connection) {
  this.name = name;
  this.path = path;
  this.connection = connection;
  this.tableCreator = new TableCreator(this);
}

GeoPackage.loadProjections = function(items) {
  if (!(items instanceof Array)) throw new Error('Invalid array of projections');
  for (var i = 0; i < items.length; i++) {
    if (!defs[items[i]]) throw new Error('Projection not found');
    this.addProjection(items[i], defs[items[i]]);
  }
}

GeoPackage.addProjection = function(name, definition) {
  if (!name || ! definition) throw new Error('Invalid projection name/definition');
  proj4.defs(''+name, ''+definition);
}

GeoPackage.hasProjection = function(name) {
  return proj4.defs(''+name);
}

GeoPackage.prototype.close = function() {
  this.connection.close();
}

GeoPackage.prototype.getDatabase = function() {
  return this.connection;
}

GeoPackage.prototype.getPath = function() {
  return this.path;
}

GeoPackage.prototype.export = function(callback) {
  this.connection.export(callback);
}

/**
 * Get the GeoPackage name
 * @return {String} the GeoPackage name
 */
GeoPackage.prototype.getName = function() {
  return this.name;
}

GeoPackage.prototype.getSpatialReferenceSystemDao = function() {
  return new SpatialReferenceSystemDao(this.connection);
}

GeoPackage.prototype.getContentsDao = function() {
  return new ContentsDao(this.connection);
}

GeoPackage.prototype.getTileMatrixSetDao = function () {
  return new TileMatrixSetDao(this.connection);
};

GeoPackage.prototype.getTileMatrixDao = function() {
  return new TileMatrixDao(this.connection);
}

GeoPackage.prototype.getDataColumnsDao = function() {
  return new DataColumnsDao(this.connection);
}

GeoPackage.prototype.getExtensionDao = function() {
  return new ExtensionDao(this.connection);
}

GeoPackage.prototype.getTableIndexDao = function() {
  return new TableIndexDao(this.connection);
}

GeoPackage.prototype.getGeometryIndexDao = function() {
  return new GeometryIndexDao(this.connection);
}

GeoPackage.prototype.getSrs = function(srsId, callback) {
  var dao = this.getSpatialReferenceSystemDao();
  dao.queryForIdObject(srsId, callback);
}

GeoPackage.prototype.getTileDaoWithTileMatrixSet = function (tileMatrixSet, callback) {
  var tileMatrices = [];
  var tileMatrixDao = this.getTileMatrixDao();
  tileMatrixDao.queryForEqWithField(TileMatrixDao.COLUMN_TABLE_NAME, tileMatrixSet.table_name, null, null, TileMatrixDao.COLUMN_ZOOM_LEVEL + ' ASC, ' + TileMatrixDao.COLUMN_PIXEL_X_SIZE + ' DESC, ' + TileMatrixDao.COLUMN_PIXEL_Y_SIZE + ' DESC', function(err, results) {
    async.eachSeries(results, function(result, callback) {
      var tm = new TileMatrix();
      tileMatrixDao.populateObjectFromResult(tm, result);
      tileMatrices.push(tm);
      callback();
    }, function(err) {
      var tableReader = new TileTableReader(tileMatrixSet);
      tableReader.readTileTable(this.connection, function(err, tileTable) {
        new TileDao(this.connection, tileTable, tileMatrixSet, tileMatrices, function(err, tileDao){
          callback(err, tileDao);
        });
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

GeoPackage.prototype.getTileDaoWithContents = function (contents, callback) {
  var dao = this.getContentsDao();
  dao.getTileMatrixSet(contents, function(err, columns) {
    this.getTileDaoWithTileMatrixSet(columns, callback);
  }.bind(this));
};

GeoPackage.prototype.getTileDaoWithTableName = function (tableName, callback) {
  var tms = this.getTileMatrixSetDao();
  tms.queryForEqWithFieldAndValue(TileMatrixSetDao.COLUMN_TABLE_NAME, tableName, function(err, results) {
    if (results.length > 1) {
      return callback(new Error('Unexpected state. More than one Tile Matrix Set matched for table name: ' + tableName + ', count: ' + results.length));
    } else if (results.length === 0) {
      return callback(new Error('No Tile Matrix found for table name: ' + tableName));
    }
    var tileMatrixSet = new TileMatrixSet();
    tms.populateObjectFromResult(tileMatrixSet, results[0]);
    this.getTileDaoWithTileMatrixSet(tileMatrixSet, callback);
  }.bind(this));
};

/**
 *  Get the tile tables
 *  @param {callback} callback called with an error if one occurred and the array of {TileTable} names
 */
GeoPackage.prototype.getTileTables = function (callback) {
  var tms = this.getTileMatrixSetDao();
  tms.isTableExists(function(err, exists) {
    if (!exists) {
      return callback(null, []);
    }
    tms.getTileTables(callback);
  });
};

/**
 *  Get the feature tables
 *  @param {callback} callback called with an error if one occurred and the array of {FeatureTable} names
 */
GeoPackage.prototype.getFeatureTables = function (callback) {
  var gcd = this.getGeometryColumnsDao();
  gcd.isTableExists(function(err, exists) {
    if (!exists) {
      return callback(null, []);
    }
    gcd.getFeatureTables(callback);
  });
};

GeoPackage.prototype.getGeometryColumnsDao = function () {
  return new GeometryColumnsDao(this.connection);
};

GeoPackage.prototype.getDataColumnConstraintsDao = function () {
  return new DataColumnConstraintsDao(this.connection);
};

GeoPackage.prototype.getMetadataReferenceDao = function () {
  return new MetadataReferenceDao(this.connection);
};

GeoPackage.prototype.getMetadataDao = function () {
  return new MetadataDao(this.connection);
};

/**
 *  Get a Feature DAO from Geometry Columns
 *
 *  @param {GeometryColumns} geometryColumns Geometry Columns
 *  @param {callback} callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithGeometryColumns = function (geometryColumns, callback) {
  if (!geometryColumns) {
    return callback(new Error('Non null Geometry Columns is required to create Feature DAO'));
  }

  var tableReader = new FeatureTableReader(geometryColumns);
  var featureTable = tableReader.readFeatureTable(this.connection, function(err, featureTable) {
    if (err) {
      return callback(err);
    }
    var dao = new FeatureDao(this.connection, featureTable, geometryColumns, this.metadataDb);

    callback(null, dao);
  }.bind(this));
};

/**
 * Get a Feature DAO from Contents
 * @param  {Contents}   contents Contents
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithContents = function (contents, callback) {
  var dao = this.getContentsDao();
  dao.getGeometryColumns(contents, function(err, columns) {
    this.getFeatureDaoWithGeometryColumns(columns, callback);
  }.bind(this));
};

/**
 * Get a Feature DAO from Contents
 * @param  {string}   tableName table name
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithTableName = function (tableName, callback) {
  var self = this;
  var dao = this.getGeometryColumnsDao();
  var geometryColumns = dao.queryForTableName(tableName, function(err, geometryColumns) {
    if (!geometryColumns) {
      return callback(new Error('No Feature Table exists for table name: ' + tableName));
    }
    self.getFeatureDaoWithGeometryColumns(geometryColumns, callback);
  });
};

/**
 * Create the Geometry Columns table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createGeometryColumnsTable = function (callback) {
  var dao = this.getGeometryColumnsDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createGeometryColumns(callback);
  }.bind(this));
};

/**
 * Create a new feature table
 * @param  {FeatureTable}   featureTable    feature table
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createFeatureTable = function(featureTable, callback) {
  this.tableCreator.createUserTable(featureTable, callback);
};

GeoPackage.prototype.createFeatureTableWithGeometryColumns = function(geometryColumns, boundingBox, srsId, columns, callback) {
  this.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumns, boundingBox, srsId, columns, undefined, callback);
};

GeoPackage.prototype.createFeatureTableWithGeometryColumnsAndDataColumns = function(geometryColumns, boundingBox, srsId, columns, dataColumns, callback) {
  this.createGeometryColumnsTable(function(err, result) {
    var featureTable = new FeatureTable(geometryColumns.table_name, columns);
    this.createFeatureTable(featureTable, function(err, result) {
      var contents = new Contents();
      contents.table_name = geometryColumns.table_name;
      contents.data_type = 'features';
      contents.identifier = geometryColumns.table_name;
      contents.last_change = new Date().toISOString();
      contents.min_x = boundingBox.minLongitude;
      contents.min_y = boundingBox.minLatitude;
      contents.max_x = boundingBox.maxLongitude;
      contents.max_y = boundingBox.maxLatitude;
      contents.srs_id = srsId;

      this.getContentsDao().create(contents, function(err, result) {
        geometryColumns.srs_id = srsId;
        this.getGeometryColumnsDao().create(geometryColumns, function(err, gcdResult) {
          if (dataColumns) {
            this.createDataColumns(function(err, result) {
              var dataColumnsDao = this.getDataColumnsDao();
              async.eachSeries(dataColumns, function(dataColumn, callback) {
                dataColumnsDao.create(dataColumn, callback);
              }, function done() {
                callback(err, gcdResult);
              });
            }.bind(this));
          } else {
            callback(err, gcdResult);
          }
        }.bind(this));
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

/**
 * Create the Tile Matrix Set table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileMatrixSetTable = function(callback) {
  var dao = this.getTileMatrixSetDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createTileMatrixSet(callback);
  }.bind(this));
}

/**
 * Create the Tile Matrix table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileMatrixTable = function(callback) {
  var dao = this.getTileMatrixDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createTileMatrix(callback);
  }.bind(this));
};

/**
 * Create a new tile table
 * @param  {TileTable}   tileTable    tile table
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileTable = function(tileTable, callback) {
  this.tableCreator.createUserTable(tileTable, callback);
};

/**
 * Create a new tile table
 * @param  {String}   tableName    tile table name
 * @param  {BoundingBox} contentsBoundingBox  bounding box of the contents table
 * @param  {Number} contentsSrsId srs id of the contents table
 * @param  {BoundingBox}  tileMatrixSetBoundingBox  bounding box of the matrix set
 * @param  {Number} tileMatrixSetSrsId  srs id of the matrix set
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileTableWithTableName = function(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId, callback) {
  var tileMatrixSet;

  async.series([
    this.createTileMatrixSetTable.bind(this),
    this.createTileMatrixTable.bind(this),
    function(callback) {
      var columns = TileTable.createRequiredColumns();
      var tileTable = new TileTable(tableName, columns);
      this.createTileTable(tileTable, callback);
    }.bind(this),
    function(callback) {
      var contents = new Contents();
      contents.table_name = tableName;
      contents.data_type = 'tiles';
      contents.identifier = tableName;
      contents.last_change = new Date().toISOString();
      contents.min_x = contentsBoundingBox.minLongitude;
      contents.min_y = contentsBoundingBox.minLatitude;
      contents.max_x = contentsBoundingBox.maxLongitude;
      contents.max_y = contentsBoundingBox.maxLatitude;
      contents.srs_id = contentsSrsId;

      tileMatrixSet = new TileMatrixSet();
      tileMatrixSet.setContents(contents);
      tileMatrixSet.srs_id = tileMatrixSetSrsId;
      tileMatrixSet.min_x = tileMatrixSetBoundingBox.minLongitude;
      tileMatrixSet.min_y = tileMatrixSetBoundingBox.minLatitude;
      tileMatrixSet.max_x = tileMatrixSetBoundingBox.maxLongitude;
      tileMatrixSet.max_y = tileMatrixSetBoundingBox.maxLatitude;
      this.getContentsDao().create(contents, function(err, result) {
        this.getTileMatrixSetDao().create(tileMatrixSet, callback);
      }.bind(this));
    }.bind(this)
  ], function(err, results) {
    callback(err, tileMatrixSet);
  });
};

GeoPackage.prototype.createStandardWebMercatorTileMatrix = function(epsg3857TileBoundingBox, tileMatrixSet, minZoom, maxZoom, callback) {
  var tileMatrixDao = this.getTileMatrixDao();

  var zoom = minZoom;

  async.whilst(
    function() {
      return zoom <= maxZoom;
    },
    function(callback) {
      var box = TileBoundingBoxUtils.webMercatorTileBox(epsg3857TileBoundingBox, zoom);
      var matrixWidth = (box.maxX - box.minX) + 1;
      var matrixHeight = (box.maxY - box.minY) + 1;

      var pixelXSize = ((epsg3857TileBoundingBox.maxLongitude - epsg3857TileBoundingBox.minLongitude) / matrixWidth) / 256;
      var pixelYSize = ((epsg3857TileBoundingBox.maxLatitude - epsg3857TileBoundingBox.minLatitude) / matrixHeight) / 256;

      var tileMatrix = new TileMatrix();
      tileMatrix.table_name = tileMatrixSet.table_name;
      tileMatrix.zoom_level = zoom;
      tileMatrix.matrix_width = matrixWidth;
      tileMatrix.matrix_height = matrixHeight;
      tileMatrix.tile_width = 256;
      tileMatrix.tile_height = 256;
      tileMatrix.pixel_x_size = pixelXSize;
      tileMatrix.pixel_y_size = pixelYSize;

      zoom++;

      tileMatrixDao.create(tileMatrix, callback);
    },
    callback
  )
};

GeoPackage.prototype.addTile = function(tileStream, tableName, zoom, tileRow, tileColumn, callback) {
  this.getTileDaoWithTableName(tableName, function(err, tileDao) {
    var newRow = tileDao.newRow();
    newRow.setZoomLevel(zoom);
    newRow.setTileColumn(tileColumn);
    newRow.setTileRow(tileRow);
    newRow.setTileData(tileStream);
    tileDao.create(newRow, callback);
  });
};

/**
 * Create the Data Columns table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createDataColumns = function(callback) {
  var dao = this.getDataColumnsDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createDataColumns(callback);
  }.bind(this));
};

/**
 * Create the Data Column Constraints table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createDataColumnConstraintsTable = function (callback) {
  var dao = this.getDataColumnConstraintsDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createDataColumnConstraints(callback);
  }.bind(this));
};

GeoPackage.prototype.createMetadataTable = function (callback) {
  var dao = this.getMetadataDao()
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createMetadata(callback);
  }.bind(this));
};

GeoPackage.prototype.createMetadataReferenceTable = function (callback) {
  var dao = this.getMetadataReferenceDao()
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createMetadataReference(callback);
  }.bind(this));
};

GeoPackage.prototype.createExtensionTable = function (callback) {
  var dao = this.getExtensionDao()
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createExtensions(callback);
  }.bind(this));
};

GeoPackage.prototype.createTableIndexTable = function (callback) {
  var dao = this.getTableIndexDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createTableIndex(callback);
  }.bind(this));
};

GeoPackage.prototype.createGeometryIndexTable = function(callback) {
  var dao = this.getGeometryIndexDao();
  dao.isTableExists(function(err, result) {
    if (result) {
      return callback(null, result);
    }
    this.tableCreator.createGeometryIndex(callback);
  }.bind(this));
};

GeoPackage.prototype.createFeatureTileLinkTable = function(callback) {
  callback(new Error('not implemented'));
};

/**
 * Get the application id of the GeoPackage
 * @param  {Function} callback callback called with the application id
 */
GeoPackage.prototype.getApplicationId = function(callback) {
  var connection = this.getDatabase();
  connection.getApplicationId(callback);
}

GeoPackage.prototype.getInfoForTable = function (tableDao, callback) {
  var gp = this;
  async.waterfall([
    function(callback) {
      var info = {};
      info.tableName = tableDao.table_name;
      info.tableType = tableDao.table.getTableType();
      callback(null, info);
    },
    function(info, callback) {
      tableDao.getCount(function(err, count) {
        info.count = count;
        callback(null, info);
      });
    }, function(info, callback) {
      if (info.tableType !== UserTable.FEATURE_TABLE) return callback(null, info);
      info.geometryColumns = {};
      info.geometryColumns.tableName = tableDao.geometryColumns.table_name;
      info.geometryColumns.geometryColumn = tableDao.geometryColumns.column_name;
      info.geometryColumns.geometryTypeName = tableDao.geometryColumns.geometry_type_name;
      info.geometryColumns.z = tableDao.geometryColumns.z;
      info.geometryColumns.m = tableDao.geometryColumns.m;
      callback(null, info);
    }, function(info, callback) {
      if (info.tableType !== UserTable.TILE_TABLE) return callback(null, info);
      info.minZoom = tableDao.minZoom;
      info.maxZoom = tableDao.maxZoom;
      info.zoomLevels = tableDao.tileMatrices.length;
      callback(null, info);
    }, function(info, callback) {
      var dao;
      var contentsRetriever;
      if (info.tableType === UserTable.FEATURE_TABLE) {
        dao = tableDao.getGeometryColumnsDao();
        contentsRetriever = tableDao.geometryColumns;
      } else if (info.tableType === UserTable.TILE_TABLE) {
        dao = tableDao.getTileMatrixSetDao();
        contentsRetriever = tableDao.tileMatrixSet;
        info.tileMatrixSet = {};
        info.tileMatrixSet.srsId = tableDao.tileMatrixSet.srs_id;
        info.tileMatrixSet.minX = tableDao.tileMatrixSet.min_x;
        info.tileMatrixSet.maxX = tableDao.tileMatrixSet.max_x;
        info.tileMatrixSet.minY = tableDao.tileMatrixSet.min_y;
        info.tileMatrixSet.maxY = tableDao.tileMatrixSet.max_y;
      }
      dao.getContents(contentsRetriever, function(err, contents) {
        info.contents = {};
        info.contents.tableName = contents.table_name;
        info.contents.dataType = contents.data_type;
        info.contents.identifier = contents.identifier;
        info.contents.description = contents.description;
        info.contents.lastChange = contents.last_change;
        info.contents.minX = contents.min_x;
        info.contents.maxX = contents.max_x;
        info.contents.minY = contents.min_y;
        info.contents.maxY = contents.max_y;
        var contentsDao = tableDao.getContentsDao();
        contentsDao.getSrs(contents, function(err, contentsSrs) {
          info.contents.srs = {
            name:contentsSrs.srs_name,
            id:contentsSrs.srs_id,
            organization:contentsSrs.organization,
            organization_coordsys_id:contentsSrs.organization_coordsys_id,
            definition:contentsSrs.definition,
            description:contentsSrs.description
          };
          tableDao.getSrs(function(err, srs){
            info.srs = {
              name:srs.srs_name,
              id:srs.srs_id,
              organization:srs.organization,
              organization_coordsys_id:srs.organization_coordsys_id,
              definition:srs.definition,
              description:srs.description
            };
            callback(null, info);
          });
        });
      });
    }, function(info, callback) {
      info.columns = [];
      info.columnMap = {};
      async.eachSeries(tableDao.table.columns, function(column, columnDone) {
        var dcd = gp.getDataColumnsDao();
        dcd.getDataColumns(tableDao.table.table_name, column.name, function(err, dataColumn) {
          info.columns.push({
            index: column.index,
            name: column.name,
            max: column.max,
            min: column.min,
            notNull: column.notNull,
            primaryKey: column.primaryKey,
            dataType: column.dataType ? DataTypes.name(column.dataType) : '',
            displayName: dataColumn && dataColumn.name ? dataColumn.name : column.name,
            dataColumn: dataColumn
          });
          info.columnMap[column.name] = info.columns[info.columns.length-1];
          columnDone();
        });
      }, function(err) {
        callback(null, info);
      });
    }
  ], callback);
};

module.exports = GeoPackage;
