/**
 * GeoPackage module.
 * @module geoPackage
 */

var SpatialReferenceSystemDao = require('./core/srs').SpatialReferenceSystemDao
  , GeometryColumnsDao = require('./features/columns').GeometryColumnsDao
  , FeatureDao = require('./features/user/featureDao')
  , FeatureTableReader = require('./features/user/featureTableReader')
  , ContentsDao = require('./core/contents').ContentsDao
  , TileMatrixSetDao = require('./tiles/matrixset').TileMatrixSetDao
  , TileMatrixSet = require('./tiles/matrixset').TileMatrixSet
  , TileMatrixDao = require('./tiles/matrix').TileMatrixDao
  , TileMatrix = require('./tiles/matrix').TileMatrix
  , TileTableReader = require('./tiles/user/tileTableReader')
  , TileDao = require('./tiles/user/tileDao')
  , UserTable = require('./user/userTable')
  , DataColumnsDao = require('./dataColumns').DataColumnsDao;

var async = require('async')
  , proj4 = require('proj4');

var defs = {
  defs: {}
};
require('proj4js-defs')(defs);
for (var name in defs.defs) {
  if (defs.defs[name]) {
    proj4.defs(name, defs.defs[name]);
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
}

GeoPackage.prototype.getDatabase = function() {
  return this.connection;
}

GeoPackage.prototype.getPath = function() {
  return this.path;
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

GeoPackage.prototype.createDao = function () {

};

GeoPackage.prototype.getSrs = function(srsId) {

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

    // TODO
    // [self dropSQLiteTriggers:geometryColumns]

    callback(null, dao);
  }.bind(this));

  /*
  if(geometryColumns == nil){
      [NSException raise:@"Illegal Argument" format:@"Non null Geometry Columns is required to create Feature DAO"];
  }

  // Read the existing table and create the dao
  GPKGFeatureTableReader * tableReader = [[GPKGFeatureTableReader alloc] initWithGeometryColumns:geometryColumns];
  GPKGFeatureTable * featureTable = [tableReader readFeatureTableWithConnection:self.database];
  GPKGFeatureDao * dao = [[GPKGFeatureDao alloc] initWithDatabase:self.database andTable:featureTable andGeometryColumns:geometryColumns andMetadataDb:self.metadataDb];

  // TODO
  // GeoPackages created with SQLite version 4.2.0+ with GeoPackage
  // support are not fully supported in previous sqlite versions
  [self dropSQLiteTriggers:geometryColumns];

  return dao;
  */
};

/**
 * Get a Feature DAO from Contents
 * @param  {Contents}   contents Contents
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithContents = function (contents, callback) {

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
        contentsDao.getSrs(contents, function(err, srs){
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
