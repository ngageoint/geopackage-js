
var Extension = require('../index').Extension
  , ExtensionDao = require('../index').ExtensionDao
  , BaseExtension = require('../baseExtension')
  , TableIndexDao = require('./tableIndex').TableIndexDao
  , TableIndex = require('./tableIndex').TableIndex
  , GeometryIndexDao = require('./geometryIndex').GeometryIndexDao
  , ContentsDao = require('../../core/contents').ContentsDao
  , EnvelopeBuilder = require('../../geom/envelopeBuilder');

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

  this.geometryIndexDao = new GeometryIndexDao(connection);

  BaseExtension.call(this, connection);
}

util.inherits(FeatureTableIndex, BaseExtension);

FeatureTableIndex.prototype.index = function() {
  return this.indexWithForce(false);
};

FeatureTableIndex.prototype.indexWithForce = function(force) {
  return this.isIndexed()
  .then(function(indexed) {
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
  }.bind(this));
}

FeatureTableIndex.prototype.isIndexed = function () {
  return this.getFeatureTableIndexExtension()
  .then(function(result) {
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
  }.bind(this));
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
  var exists = this.tableIndexDao.isTableExists();
  if (!exists) {
    return this.tableIndexDao.createTable()
    .then(function() {
      this.createTableIndex();
      return this.getTableIndex();
    }.bind(this));
  } else {
    this.createTableIndex();
    return Promise.resolve(this.getTableIndex());
  }
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
  var rows = this.featureDao.queryForAll();
  rows.forEach(function(row) {
    var fr = this.featureDao.getFeatureRow(row);
    this.indexRow(tableIndex, fr.getId(), fr.getGeometry());
  }.bind(this));
  return this.updateLastIndexed(tableIndex);
};

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

FeatureTableIndex.prototype.queryWithBoundingBox = function(boundingBox, projection, rowCallback) {
  var srs = this.featureDao.getSrs();
  var projectedBoundingBox = boundingBox.projectBoundingBox(projection, srs.organization + ':' + srs.organization_coordsys_id);
  var envelope = projectedBoundingBox.buildEnvelope();
  return this.queryWithGeometryEnvelope(envelope, rowCallback);
}

FeatureTableIndex.prototype.queryWithGeometryEnvelope = function(envelope, rowCallback) {
  var where = '';
  where += this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, this.tableName);
  where += ' and ';
  var minXLessThanMaxX = envelope.minX < envelope.maxX;
  if (minXLessThanMaxX) {
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MIN_X, envelope.maxX, '<=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MAX_X, envelope.minX, '>=');
  } else {
    where += '(';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MIN_X, envelope.maxX, '<=');
    where += ' or ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MAX_X, envelope.minX, '>=');
    where += ' or ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MIN_X, envelope.minX, '>=');
    where += ' or ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MAX_X, envelope.maxX, '<=');
    where += ')';
  }

  where += ' and ';
  where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MIN_Y, envelope.maxY, '<=');
  where += ' and ';
  where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MAX_Y, envelope.minY, '>=');

  var whereArgs = [this.tableName, envelope.maxX, envelope.minX];
  if (!minXLessThanMaxX) {
    whereArgs.push(envelope.minX, envelope.maxX);
  }
  whereArgs.push(envelope.maxY, envelope.minY);
  if (envelope.hasZ) {
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MIN_Z, envelope.minZ, '<=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MAX_Z, envelope.maxZ, '>=');
    whereArgs.push(envelope.maxZ, envelope.minZ);
  }

  if (envelope.hasM) {
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MIN_M, envelope.minM, '<=');
    where += ' and ';
    where += this.geometryIndexDao.buildWhereWithFieldAndValueAndOperation(GeometryIndexDao.COLUMN_MAX_M, envelope.maxM, '>=');
    whereArgs.push(envelope.maxM, envelope.minM);
  }

  var join = 'inner join ' + this.tableName + ' on ' + this.tableName + '.id = ' + GeometryIndexDao.COLUMN_GEOM_ID;

  return this.geometryIndexDao.queryJoinWhereWithArgs(join, where, whereArgs, [this.tableName + '.*'], rowCallback);
}

FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR = 'nga';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR = 'geometry_index';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';

module.exports = FeatureTableIndex;
