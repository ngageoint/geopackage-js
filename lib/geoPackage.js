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

GeoPackage.prototype.getSrs = function(srsId) {
  var dao = this.getSpatialReferenceSystemDao();
  return dao.queryForIdObject(srsId);
}

GeoPackage.prototype.createRequiredTables = function() {
  var geopackage = this;
  return this.tableCreator.createRequired()
  .then(function(results) {
    return geopackage;
  });
}

GeoPackage.prototype.getTileDaoWithTileMatrixSet = function (tileMatrixSet) {
  var tileMatrices = [];
  var tileMatrixDao = this.getTileMatrixDao();
  return tileMatrixDao.queryForAllEqWithField(TileMatrixDao.COLUMN_TABLE_NAME, tileMatrixSet.table_name, null, null, TileMatrixDao.COLUMN_ZOOM_LEVEL + ' ASC, ' + TileMatrixDao.COLUMN_PIXEL_X_SIZE + ' DESC, ' + TileMatrixDao.COLUMN_PIXEL_Y_SIZE + ' DESC')
  .then(function(results) {
    results.forEach(function(result) {
      var tm = new TileMatrix();
      tileMatrixDao.populateObjectFromResult(tm, result);
      tileMatrices.push(tm);
    });
    var tableReader = new TileTableReader(tileMatrixSet);
    var tileTable = tableReader.readTileTable(this.connection);
    return new TileDao(this.connection, tileTable, tileMatrixSet, tileMatrices);
  }.bind(this));
};

GeoPackage.prototype.getTileDaoWithContents = function (contents) {
  var dao = this.getContentsDao();
  return dao.getTileMatrixSet(contents)
  .then(function(columns) {
    return this.getTileDaoWithTileMatrixSet(columns);
  }.bind(this));
};

GeoPackage.prototype.getTileDaoWithTableName = function (tableName) {
  var tms = this.getTileMatrixSetDao();
  return tms.queryForAllEqWithFieldAndValue(TileMatrixSetDao.COLUMN_TABLE_NAME, tableName)
  .then(function(results) {
    if (results.length > 1) {
      throw new Error('Unexpected state. More than one Tile Matrix Set matched for table name: ' + tableName + ', count: ' + results.length);
    } else if (results.length === 0) {
      throw new Error('No Tile Matrix found for table name: ' + tableName);
    }
    var tileMatrixSet = new TileMatrixSet();
    tms.populateObjectFromResult(tileMatrixSet, results[0]);
    return this.getTileDaoWithTileMatrixSet(tileMatrixSet);
  }.bind(this));
};

/**
 * Gets the tables from the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {Function} callback   called with an error if one occurred and an object containing a 'features' property which is an array of feature table names and a 'tiles' property which is an array of tile table names
 */
GeoPackage.prototype.getTables = function() {
  var tables = {};
  var featureTables = this.getFeatureTables();
  tables.features = featureTables;
  var tileTables = this.getTileTables();
  tables.tiles = tileTables;
  return tables;
};

/**
 *  Get the tile tables
 *  @param {callback} callback called with an error if one occurred and the array of {TileTable} names
 */
GeoPackage.prototype.getTileTables = function () {
  var tms = this.getTileMatrixSetDao();
  if (!tms.isTableExists()) {
    return [];
  }
  return tms.getTileTables();
};

/**
 * Checks if the tile table exists in the GeoPackage
 * @param  {String} tileTableName name of the table to query for
 * @param  {Function} callback   called with an error if one occurred and true or false for the existence of the table
 */
GeoPackage.prototype.hasTileTable = function(tileTableName) {
  var tables = this.getTileTables();
  return tables && tables.indexOf(tileTableName) != -1;
};

/**
 * Checks if the feature table exists in the GeoPackage
 * @param  {GeoPackage}   geopackage open GeoPackage object
 * @param  {String} featureTableName name of the table to query for
 * @param  {Function} callback   called with an error if one occurred and true or false for the existence of the table
 */
GeoPackage.prototype.hasFeatureTable = function(featureTableName) {
  var tables = this.getFeatureTables();
  return tables && tables.indexOf(featureTableName) != -1;
};

/**
 *  Get the feature tables
 *  @param {callback} callback called with an error if one occurred and the array of {FeatureTable} names
 */
GeoPackage.prototype.getFeatureTables = function () {
  var gcd = this.getGeometryColumnsDao();
  if (!gcd.isTableExists()) {
    return [];
  }
  return gcd.getFeatureTables();
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

GeoPackage.prototype.index = function() {
  var tables = this.getFeatureTables();

  return tables.reduce(function(sequence, table) {
    return sequence.then(function() {
      return this.indexFeatureTable(table)
      .then(function(indexed) {
        if (indexed) {
          return true;
        } else {
          throw new Error('Unable to index table ' + table);
        }
      });
    }.bind(this))
  }.bind(this), Promise.resolve());
}

GeoPackage.prototype.indexFeatureTable = function(table) {
  return this.getFeatureDaoWithTableName(table)
  .then(function(featureDao) {
    var fti = featureDao.featureTableIndex;
    var tableIndex = fti.getTableIndex();
    if (tableIndex) {
      return true;
    }
    return fti.index();
  });
}

/**
 *  Get a Feature DAO from Geometry Columns
 *
 *  @param {GeometryColumns} geometryColumns Geometry Columns
 *  @param {callback} callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithGeometryColumns = function (geometryColumns) {
  if (!geometryColumns) {
    throw new Error('Non null Geometry Columns is required to create Feature DAO');
  }

  var tableReader = new FeatureTableReader(geometryColumns);
  return tableReader.readFeatureTable(this.connection)
  .then(function(featureTable) {
    var dao = new FeatureDao(this.connection, featureTable, geometryColumns, this.metadataDb);
    return dao;
  }.bind(this));
};

/**
 * Get a Feature DAO from Contents
 * @param  {Contents}   contents Contents
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithContents = function (contents) {
  var dao = this.getContentsDao();
  return dao.getGeometryColumns(contents)
  .then(function(columns) {
    return this.getFeatureDaoWithGeometryColumns(columns);
  }.bind(this));
};

/**
 * Get a Feature DAO from Contents
 * @param  {string}   tableName table name
 * @param  {Function} callback callback called with an error if one occurred and the {FeatureDao}
 */
GeoPackage.prototype.getFeatureDaoWithTableName = function (tableName) {
  var dao = this.getGeometryColumnsDao();
  return dao.queryForTableName(tableName)
  .then(function(geometryColumns) {
    if (!geometryColumns) {
      throw new Error('No Feature Table exists for table name: ' + tableName);
    }
    return this.getFeatureDaoWithGeometryColumns(geometryColumns);
  }.bind(this));
};

/**
 * Queries for GeoJSON features in a feature table
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} callback    Caled with err, featureArray
 */
GeoPackage.prototype.queryForGeoJSONFeaturesInTable = function(tableName, boundingBox) {
  var foundFeatures = [];
  return this.getFeatureDaoWithTableName(tableName)
  .then(function(featureDao) {
    return featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox, function(err, row) {
      foundFeatures.push(row);
    }).then(function() {
      return foundFeatures;
    });
  });
}

/**
 * iterates GeoJSON features in a feature table within a bounding box
 * @param  {String}   tableName   Table name to query
 * @param  {BoundingBox}   boundingBox BoundingBox to query
 * @param  {Function} rowCallback    Caled with err, geoJSON
 * @param  {Function} doneCallback    Caled with err if one occurred
 */
GeoPackage.prototype.iterateGeoJSONFeaturesInTableWithinBoundingBox = function(tableName, boundingBox, rowCallback) {
  return this.getFeatureDaoWithTableName(tableName)
  .then(function(featureDao) {
    return featureDao.queryForGeoJSONIndexedFeaturesWithBoundingBox(boundingBox, rowCallback);
  });
}

/**
 * Create the Geometry Columns table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createGeometryColumnsTable = function () {
  var dao = this.getGeometryColumnsDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createGeometryColumns();
};

/**
 * Create a new feature table
 * @param  {FeatureTable}   featureTable    feature table
 * @param  {Function} callback called with an error if one occurred otherwise the table now existscreateTileTableWithTableName
 */
GeoPackage.prototype.createFeatureTable = function(featureTable) {
  return this.tableCreator.createUserTable(featureTable);
};

GeoPackage.prototype.createFeatureTableWithGeometryColumns = function(geometryColumns, boundingBox, srsId, columns) {
  return this.createFeatureTableWithGeometryColumnsAndDataColumns(geometryColumns, boundingBox, srsId, columns, undefined);
};

GeoPackage.prototype.createFeatureTableWithGeometryColumnsAndDataColumns = function(geometryColumns, boundingBox, srsId, columns, dataColumns) {
  return this.createGeometryColumnsTable()
  .then(function(result) {
    var featureTable = new FeatureTable(geometryColumns.table_name, columns);
    var result = this.createFeatureTable(featureTable);
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

    this.getContentsDao().create(contents);
    geometryColumns.srs_id = srsId;
    return this.getGeometryColumnsDao().create(geometryColumns);
  }.bind(this))
  .then(function() {
    if (dataColumns) {
      return this.createDataColumns()
      .then(function() {
        var dataColumnsDao = this.getDataColumnsDao();
        dataColumns.forEach(function(dataColumn) {
          dataColumnsDao.create(dataColumn);
        });
      }.bind(this));
    }
  }.bind(this))
  .then(function() {
    return true;
  });
};

/**
 * Create the Tile Matrix Set table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileMatrixSetTable = function() {
  var dao = this.getTileMatrixSetDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createTileMatrixSet();
}

/**
 * Create the Tile Matrix table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileMatrixTable = function() {
  var dao = this.getTileMatrixDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createTileMatrix();
};

/**
 * Create a new tile table
 * @param  {TileTable}   tileTable    tile table
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createTileTable = function(tileTable) {
  return this.tableCreator.createUserTable(tileTable);
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
GeoPackage.prototype.createTileTableWithTableName = function(tableName, contentsBoundingBox, contentsSrsId, tileMatrixSetBoundingBox, tileMatrixSetSrsId) {
  var tileMatrixSet;

  var columns = TileTable.createRequiredColumns();
  var tileTable = new TileTable(tableName, columns);
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

  return this.createTileMatrixSetTable()
    .then(function() {
      return this.createTileMatrixTable();
    }.bind(this))
    .then(function() {
      return this.createTileTable(tileTable);
    }.bind(this))
    .then(function() {
      return this.getContentsDao().create(contents);
    }.bind(this))
    .then(function() {
      return this.getTileMatrixSetDao().create(tileMatrixSet);
    }.bind(this))
    .then(function() {
      return tileMatrixSet;
    });
};

GeoPackage.prototype.createStandardWebMercatorTileMatrix = function(epsg3857TileBoundingBox, tileMatrixSet, minZoom, maxZoom) {
  var tileMatrixDao = this.getTileMatrixDao();

  for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
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
    tileMatrixDao.create(tileMatrix);
  }
};

/**
 * Adds a tile to the GeoPackage
 * @param  {object}   tile       Byte array or Buffer containing the tile bytes
 * @param  {String}   tableName  Table name to add the tile to
 * @param  {Number}   zoom       zoom level of this tile
 * @param  {Number}   tileRow    row of this tile
 * @param  {Number}   tileColumn column of this tile
 * @param  {Function} callback   called with an eror if one occurred and the inserted row
 */
GeoPackage.prototype.addTile = function(tileStream, tableName, zoom, tileRow, tileColumn) {
  return this.getTileDaoWithTableName(tableName)
  .then(function(tileDao) {
    var newRow = tileDao.newRow();
    newRow.setZoomLevel(zoom);
    newRow.setTileColumn(tileColumn);
    newRow.setTileRow(tileRow);
    newRow.setTileData(tileStream);
    return tileDao.create(newRow);
  });
};

/**
 * Create the Data Columns table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createDataColumns = function() {
  var dao = this.getDataColumnsDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createDataColumns();
};

/**
 * Create the Data Column Constraints table if it does not already exist
 * @param  {Function} callback called with an error if one occurred otherwise the table now exists
 */
GeoPackage.prototype.createDataColumnConstraintsTable = function () {
  var dao = this.getDataColumnConstraintsDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createDataColumnConstraints();
};

GeoPackage.prototype.createMetadataTable = function () {
  var dao = this.getMetadataDao()
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createMetadata();
};

GeoPackage.prototype.createMetadataReferenceTable = function () {
  var dao = this.getMetadataReferenceDao()
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createMetadataReference();
};

GeoPackage.prototype.createExtensionTable = function () {
  var dao = this.getExtensionDao()
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createExtensions();
};

GeoPackage.prototype.createTableIndexTable = function () {
  var dao = this.getTableIndexDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createTableIndex();
};

GeoPackage.prototype.createGeometryIndexTable = function() {
  var dao = this.getGeometryIndexDao();
  if (dao.isTableExists()) {
    return Promise.resolve().then(function() { return true; });
  }
  return this.tableCreator.createGeometryIndex();
};

/**
 * Get the application id of the GeoPackage
 * @param  {Function} callback callback called with the application id
 */
GeoPackage.prototype.getApplicationId = function() {
  var connection = this.getDatabase();
  return connection.getApplicationId();
}

GeoPackage.prototype.getInfoForTable = function (tableDao) {
  var info = {};
  info.tableName = tableDao.table_name;
  info.tableType = tableDao.table.getTableType();
  info.count = tableDao.getCount();
  if (info.tableType === UserTable.FEATURE_TABLE) {
    info.geometryColumns = {};
    info.geometryColumns.tableName = tableDao.geometryColumns.table_name;
    info.geometryColumns.geometryColumn = tableDao.geometryColumns.column_name;
    info.geometryColumns.geometryTypeName = tableDao.geometryColumns.geometry_type_name;
    info.geometryColumns.z = tableDao.geometryColumns.z;
    info.geometryColumns.m = tableDao.geometryColumns.m;
  }
  if (info.tableType === UserTable.TILE_TABLE) {
    info.minZoom = tableDao.minZoom;
    info.maxZoom = tableDao.maxZoom;
    info.minWebMapZoom = tableDao.minWebMapZoom;
    info.maxWebMapZoom = tableDao.maxWebMapZoom;
    info.zoomLevels = tableDao.tileMatrices.length;
  }

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
  var contents = dao.getContents(contentsRetriever);
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
  var contentsSrs = contentsDao.getSrs(contents);
  info.contents.srs = {
    name:contentsSrs.srs_name,
    id:contentsSrs.srs_id,
    organization:contentsSrs.organization,
    organization_coordsys_id:contentsSrs.organization_coordsys_id,
    definition:contentsSrs.definition,
    description:contentsSrs.description
  };
  var srs = tableDao.getSrs();

  info.srs = {
    name:srs.srs_name,
    id:srs.srs_id,
    organization:srs.organization,
    organization_coordsys_id:srs.organization_coordsys_id,
    definition:srs.definition,
    description:srs.description
  };
  info.columns = [];
  info.columnMap = {};

  var dcd = this.getDataColumnsDao();
  return tableDao.table.columns.reduce(function(sequence, column) {
    return sequence.then(function() {
      return dcd.getDataColumns(tableDao.table.table_name, column.name);
    }).then(function(dataColumn) {
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
      return info;
    });
  }, Promise.resolve());
};

module.exports = GeoPackage;
