
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

FeatureTableIndex.prototype.index = function(progressCallback, callback) {
  this.indexWithForce(false, progressCallback, callback);
};

FeatureTableIndex.prototype.indexWithForce = function(force, progressCallback, callback) {
  this.isIndexed(function(err, indexed) {
    if (err) return callback(err);
    if (force || !indexed) {
      this.getOrCreateExtension(function(err) {
        if (err) return callback(err);
        this.getOrCreateTableIndex(function(err, tableIndex) {
          this.createOrClearGeometryIndicies(function(err) {
            this.indexTable(tableIndex, progressCallback, callback);
          }.bind(this));
        }.bind(this));
      }.bind(this));
    } else {
      callback();
    }
  }.bind(this));
}

FeatureTableIndex.prototype.isIndexed = function (callback) {
  this.getFeatureTableIndexExtension(function(err, result) {
    if (result) {
      var contentsDao = new ContentsDao(this.connection);
      contentsDao.queryForIdObject(this.tableName, function(err, contents) {
        if (!contents) return callback(null, false);
        var lastChange = new Date(contents.last_change);
        this.tableIndexDao.queryForIdObject(this.tableName, function(err, tableIndex) {
          if (!tableIndex || !tableIndex.last_indexed) {
            return callback(null, false);
          }
          var lastIndexed = new Date(tableIndex.last_indexed);
          callback(null, lastIndexed >= lastChange);
        });
      }.bind(this));
    } else {
      return callback(null, false);
    }
  }.bind(this));
};

FeatureTableIndex.prototype.getFeatureTableIndexExtension = function (callback) {
  this.getExtension(this.extensionName, this.tableName, this.columnName, callback);
};

FeatureTableIndex.prototype.getOrCreateExtension = function(callback) {
  this.getOrCreate(this.extensionName, this.tableName, this.columnName, this.extensionDefinition, Extension.READ_WRITE, callback);
};

FeatureTableIndex.prototype.getOrCreateTableIndex = function(callback) {
  this.getTableIndex(function(err, tableIndex) {
    if (tableIndex) return callback(err, tableIndex);
    this.tableIndexDao.isTableExists(function(err, exists) {
      if (!exists) {
        this.tableIndexDao.createTable(function(err) {
          this.createTableIndex(function() {
            this.getTableIndex(callback);
          }.bind(this));
        }.bind(this));
      } else {
        this.createTableIndex(function() {
          this.getTableIndex(callback);
        }.bind(this));
      }
    }.bind(this));
  }.bind(this));
};

FeatureTableIndex.prototype.createTableIndex = function(callback) {
  var ti = new TableIndex();
  ti.table_name = this.tableName;
  ti.last_indexed = this.lastIndexed;
  this.tableIndexDao.create(ti, callback);
};

FeatureTableIndex.prototype.getTableIndex = function(callback) {
  this.tableIndexDao.isTableExists(function(err, exists){
    if (exists) {
      this.tableIndexDao.queryForIdObject(this.tableName, callback);
    } else {
      callback();
    }
  }.bind(this));
};

FeatureTableIndex.prototype.createOrClearGeometryIndicies = function(callback) {
  this.geometryIndexDao.createTable(function(err, exists) {
    this.clearGeometryIndicies(callback);
  }.bind(this));
};

FeatureTableIndex.prototype.clearGeometryIndicies = function(callback) {
  var where = this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, this.tableName);
  var whereArgs = this.geometryIndexDao.buildWhereArgsWithValue(this.tableName);
  this.geometryIndexDao.deleteWhere(where, whereArgs, callback);
};

FeatureTableIndex.prototype.indexTable = function(tableIndex, progressCallback, callback) {
  if (!callback) {
    callback = progressCallback;
    progressCallback = function() {}
  }
  this.featureDao.queryForAll(function(err, rows, rowDone) {
    async.each(rows, function(row, callback) {
      async.setImmediate(function() {
        var fr = this.featureDao.getFeatureRow(row);
        this.indexRow(tableIndex, fr.getId(), fr.getGeometry(), callback);
      }.bind(this));
    }.bind(this), function(err) {
      if (err) return callback(err);
      this.updateLastIndexed(tableIndex, callback);
    }.bind(this));
  }.bind(this));
};

FeatureTableIndex.prototype.indexRow = function(tableIndex, geomId, geomData, callback) {
  if (!geomData) return callback();
  var envelope = geomData.envelope;
  if (!envelope) {
    var geometry = geomData.geometry;
    if (geometry) {
      envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geometry);
    }
  }
  if (envelope) {
    var geometryIndex = this.geometryIndexDao.populate(tableIndex, geomId, envelope);
    return this.geometryIndexDao.createOrUpdate(geometryIndex, callback);
  } else {
    callback(null, false);
  }
};

FeatureTableIndex.prototype.updateLastIndexed = function(tableIndex, callback) {
  if (!tableIndex) {
    tableIndex = new TableIndex();
    tableIndex.table_name = this.tableName;
  }
  tableIndex.last_indexed = new Date().toISOString();
  this.tableIndexDao.createOrUpdate(tableIndex, callback);
}

FeatureTableIndex.prototype.queryWithBoundingBox = function(boundingBox, projection, rowCallback, doneCallback) {
  this.featureDao.getSrs(function(err, srs) {
    var projectedBoundingBox = boundingBox.projectBoundingBox(projection, srs.organization + ':' + srs.organization_coordsys_id);
    var envelope = projectedBoundingBox.buildEnvelope();
    this.queryWithGeometryEnvelope(envelope, rowCallback, doneCallback);
  }.bind(this));
}

FeatureTableIndex.prototype.queryWithGeometryEnvelope = function(envelope, rowCallback, doneCallback) {
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

  this.geometryIndexDao.queryJoinWhereWithArgs(join, where, whereArgs, [this.tableName + '.*'], rowCallback, doneCallback);
}

FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR = 'nga';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR = 'geometry_index';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';

module.exports = FeatureTableIndex;
