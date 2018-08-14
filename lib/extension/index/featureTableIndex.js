
var Extension = require('../index').Extension
  , ExtensionDao = require('../index').ExtensionDao
  , BaseExtension = require('../baseExtension')
  , TableIndexDao = require('./tableIndex').TableIndexDao
  , TableIndex = require('./tableIndex').TableIndex
  , GeometryIndexDao = require('./geometryIndex').GeometryIndexDao
  , RTreeIndexDao = require('./rtreeIndex').RTreeIndexDao
  , ContentsDao = require('../../core/contents').ContentsDao
  , EnvelopeBuilder = require('../../geom/envelopeBuilder');

var proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

var util = require('util')
  , async = require('async');

/**
 * Feature Table Index NGA Extension implementation. This extension is used to
 * index Geometries within a feature table by their minimum bounding box for
 * bounding box queries. This extension is required to provide an index
 * implementation when a SQLite version is used before SpatialLite support
 * (iOS).
 */
var FeatureTableIndex = function(connection, featureDao) {

  /**
   * Progress
   */
  this.progress;

  this.connection = connection;

  this.featureDao = featureDao;

  this.extensionName = Extension.buildExtensionName(FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR, FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR);

  this.extensionDefinition = FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION;

  this.tableName = featureDao.table_name;

  this.columnName = featureDao.getGeometryColumnName();

  this.extensionsDao = new ExtensionDao(connection);

  this.tableIndexDao = new TableIndexDao(connection);

  this.geometryIndexDao = new GeometryIndexDao(connection, featureDao);

  this.rtreeIndexDao = new RTreeIndexDao(connection, featureDao);
  this.rtreeIndexDao.gpkgTableName = 'rtree_'+this.tableName+'_'+this.columnName;

  this.rtreeIndexed = this.hasExtension('gpkg_rtree_index', this.tableName, this.columnName);

  BaseExtension.call(this, connection);
}

util.inherits(FeatureTableIndex, BaseExtension);

FeatureTableIndex.prototype.index = function(progress) {
  return this.indexWithForce(false, progress);
};

FeatureTableIndex.prototype.indexWithForce = function(force, progress) {
  progress = progress || function() {};
  this.progress = function(message) {
    setTimeout(progress, 0, message);
  };
  var indexed = this.isIndexed();
  if (force || !indexed) {
    return this.getOrCreateExtension()
    .then(function(extension) {
      return this.getOrCreateTableIndex();
    }.bind(this))
    .then(function(tableIndex) {
      return this.createOrClearGeometryIndicies()
      .then(function() {
        return this.indexTable(tableIndex);
      }.bind(this))
      .then(function() {
        return true;
      });
    }.bind(this));
  } else {
    return Promise.resolve(indexed);
  }
}

FeatureTableIndex.prototype.isIndexed = function () {
  if (this.rtreeIndexed) return true;

  try {
    var result = this.getFeatureTableIndexExtension();
    if (result) {
      var contentsDao = new ContentsDao(this.connection);
      var contents = contentsDao.queryForIdObject(this.tableName);
      if (!contents) return false;
      var lastChange = new Date(contents.last_change);
      var tableIndex = this.tableIndexDao.queryForIdObject(this.tableName);
      if (!tableIndex || !tableIndex.last_indexed) {
        return false;
      }
      var lastIndexed = new Date(tableIndex.last_indexed);
      return lastIndexed >= lastChange;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};

FeatureTableIndex.prototype.getFeatureTableIndexExtension = function () {
  return this.getExtension(this.extensionName, this.tableName, this.columnName);
};

FeatureTableIndex.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, this.tableName, this.columnName, this.extensionDefinition, Extension.READ_WRITE);
};

FeatureTableIndex.prototype.getOrCreateTableIndex = function() {
  var tableIndex = this.getTableIndex();
  if (tableIndex) return Promise.resolve(tableIndex);
  return this.tableIndexDao.createTable()
  .then(function() {
    this.createTableIndex();
    return this.getTableIndex();
  }.bind(this));
};

FeatureTableIndex.prototype.createTableIndex = function() {
  var ti = new TableIndex();
  ti.table_name = this.tableName;
  ti.last_indexed = this.lastIndexed;
  return this.tableIndexDao.create(ti);
};

FeatureTableIndex.prototype.getTableIndex = function() {
  if (this.tableIndexDao.isTableExists()) {
    return this.tableIndexDao.queryForIdObject(this.tableName);
  } else {
    return;
  }
};

FeatureTableIndex.prototype.createOrClearGeometryIndicies = function() {
  return this.geometryIndexDao.createTable()
  .then(function() {
    return this.clearGeometryIndicies();
  }.bind(this));
};

FeatureTableIndex.prototype.clearGeometryIndicies = function() {
  var where = this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, this.tableName);
  var whereArgs = this.geometryIndexDao.buildWhereArgsWithValue(this.tableName);
  return this.geometryIndexDao.deleteWhere(where, whereArgs);
};

FeatureTableIndex.prototype.indexTable = function(tableIndex) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      this.indexChunk(0, tableIndex, resolve, reject);
    }.bind(this));
  }.bind(this))
  .then(function(result) {
    return this.updateLastIndexed(tableIndex);
  }.bind(this));
};

FeatureTableIndex.prototype.indexChunk = function(page, tableIndex, resolve, reject) {
  this.progress('Indexing ' + (page * 100) + ' to ' + ((page+1) * 100));
  console.log('Indexing ' + (page * 100) + ' to ' + ((page+1) * 100));
  var rows = this.featureDao.queryForChunk(100, page);
  if (rows.length) {
    rows.forEach(function(row) {
      var fr = this.featureDao.getFeatureRow(row);
      this.indexRow(tableIndex, fr.getId(), fr.getGeometry());
    }.bind(this));
    setTimeout(function() {
      this.indexChunk(++page, tableIndex, resolve, reject);
    }.bind(this));
  } else {
    resolve();
  }
}

FeatureTableIndex.prototype.indexRow = function(tableIndex, geomId, geomData) {
  if (!geomData) return false;
  var envelope = geomData.envelope;
  if (!envelope) {
    var geometry = geomData.geometry;
    if (geometry) {
      envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geometry);
    }
  }
  if (envelope) {
    var geometryIndex = this.geometryIndexDao.populate(tableIndex, geomId, envelope);
    return this.geometryIndexDao.createOrUpdate(geometryIndex);
  } else {
    return false;
  }
};

FeatureTableIndex.prototype.updateLastIndexed = function(tableIndex) {
  if (!tableIndex) {
    tableIndex = new TableIndex();
    tableIndex.table_name = this.tableName;
  }
  tableIndex.last_indexed = new Date().toISOString();
  var updateIndex = this.tableIndexDao.createOrUpdate(tableIndex);
  return updateIndex;
}

FeatureTableIndex.prototype.queryWithBoundingBox = function(boundingBox, projection) {
  var projectedBoundingBox = boundingBox.projectBoundingBox(projection, this.featureDao.projection);
  var envelope = projectedBoundingBox.buildEnvelope();
  return this.queryWithGeometryEnvelope(envelope);
}

FeatureTableIndex.prototype.queryWithGeometryEnvelope = function(envelope) {
  if (this.rtreeIndexed) {
    return this.rtreeIndexDao.queryWithGeometryEnvelope(envelope);
  } else {
    return this.geometryIndexDao.queryWithGeometryEnvelope(envelope);
  }
}

FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR = 'nga';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR = 'geometry_index';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';

module.exports = FeatureTableIndex;
