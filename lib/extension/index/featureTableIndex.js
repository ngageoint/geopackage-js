/**
 * Feature Table Index
 * @module extension/index
 */

var Extension = require('../index').Extension
  , ExtensionDao = require('../index').ExtensionDao
  , BaseExtension = require('../baseExtension')
  , TableIndexDao = require('./tableIndex').TableIndexDao
  , TableIndex = require('./tableIndex').TableIndex
  , GeometryIndexDao = require('./geometryIndex').GeometryIndexDao
  , RTreeIndexDao = require('../rtree').RTreeIndexDao
  , RTreeIndex = require('../rtree').RTreeIndex
  , ContentsDao = require('../../core/contents').ContentsDao
  , EnvelopeBuilder = require('../../geom/envelopeBuilder');

var proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

var util = require('util');

/**
 * This class will either use the RTree index if it exists, or the
 * Feature Table Index NGA Extension implementation. This extension is used to
 * index Geometries within a feature table by their minimum bounding box for
 * bounding box queries.
 * @extends {module:extension/baseExtension~BaseExtension}
 * @class
 */
var FeatureTableIndex = function(geoPackage, featureDao) {
  BaseExtension.call(this, geoPackage);

  this.progress;

  /**
   * Feature Dao to index
   * @type {module:features/user/featureDao~FeatureDao}
   */
  this.featureDao = featureDao;

  this.extensionName = Extension.buildExtensionName(FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR, FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR);

  this.extensionDefinition = FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION;

  this.tableName = featureDao.table_name;

  this.columnName = featureDao.getGeometryColumnName();

  this.extensionsDao = geoPackage.getExtensionDao();

  this.tableIndexDao = geoPackage.getTableIndexDao();

  this.geometryIndexDao = geoPackage.getGeometryIndexDao(featureDao);

  this.rtreeIndexDao = new RTreeIndexDao(geoPackage, featureDao);
  this.rtreeIndexDao.gpkgTableName = 'rtree_'+this.tableName+'_'+this.columnName;

  this.rtreeIndex = new RTreeIndex(geoPackage, featureDao);

  /**
   * true if the table is indexed with an RTree
   * @type {Boolean}
   */
  this.rtreeIndexed = this.hasExtension('gpkg_rtree_index', this.tableName, this.columnName);
}

util.inherits(FeatureTableIndex, BaseExtension);

/**
 * Index the table if not already indexed
 * @param  {Function} progress function which is called with progress while indexing
 * @return {Promise<Boolean>} promise resolved when the indexing is complete
 */
FeatureTableIndex.prototype.index = function(progress) {
  return this.indexWithForce(false, progress);
};

/**
 * Index the table if not already indexed or force is true
 * @param  {Boolean} force force index even if the table is already indexed
 * @param  {Function} progress function which is called with progress while indexing
 * @return {Promise<Boolean>} promise resolved when the indexing is complete
 */
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

/**
 * Check if the table is indexed either with an RTree or the NGA Feature Table Index
 * @return {Boolean}
 */
FeatureTableIndex.prototype.isIndexed = function () {
  if (this.rtreeIndexed) return true;

  try {
    var result = this.getFeatureTableIndexExtension();
    if (result) {
      var contentsDao = this.geoPackage.getContentsDao();
      var contents = contentsDao.queryForId(this.tableName);
      if (!contents) return false;
      var lastChange = new Date(contents.last_change);
      var tableIndex = this.tableIndexDao.queryForId(this.tableName);
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

/**
 * Returns the feature table index extension for this table and column name if exists
 * @return {module:extension~Extension}
 */
FeatureTableIndex.prototype.getFeatureTableIndexExtension = function () {
  return this.getExtension(this.extensionName, this.tableName, this.columnName);
};

/**
 * Get or create the extension for this table name and column name
 * @return {module:extension~Extension}
 */
FeatureTableIndex.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, this.tableName, this.columnName, this.extensionDefinition, Extension.READ_WRITE);
};

/**
 * Get or create if needed the table index
 * @return {Promise<TableIndex>}
 */
FeatureTableIndex.prototype.getOrCreateTableIndex = function() {
  var tableIndex = this.getTableIndex();
  if (tableIndex) return Promise.resolve(tableIndex);
  return this.tableIndexDao.createTable()
  .then(function() {
    this.createTableIndex();
    return this.getTableIndex();
  }.bind(this));
};

/**
 * Create the table index
 * @return {module:extension/index~TableIndex}
 */
FeatureTableIndex.prototype.createTableIndex = function() {
  var ti = new TableIndex();
  ti.table_name = this.tableName;
  ti.last_indexed = this.lastIndexed;
  return this.tableIndexDao.create(ti);
};

/**
 * Get the table index
 * @return {module:extension/index~TableIndex}
 */
FeatureTableIndex.prototype.getTableIndex = function() {
  if (this.tableIndexDao.isTableExists()) {
    return this.tableIndexDao.queryForId(this.tableName);
  } else {
    return;
  }
};

/**
 * Clear the geometry indices or create the table if needed
 * @return {Promise} resolved when complete
 */
FeatureTableIndex.prototype.createOrClearGeometryIndicies = function() {
  return this.geometryIndexDao.createTable()
  .then(function() {
    return this.clearGeometryIndicies();
  }.bind(this));
};

/**
 * Clears the geometry indices
 * @return {Number} number of rows deleted
 */
FeatureTableIndex.prototype.clearGeometryIndicies = function() {
  var where = this.geometryIndexDao.buildWhereWithFieldAndValue(GeometryIndexDao.COLUMN_TABLE_NAME, this.tableName);
  var whereArgs = this.geometryIndexDao.buildWhereArgs(this.tableName);
  return this.geometryIndexDao.deleteWhere(where, whereArgs);
};

/**
 * Indexes the table
 * @param  {module:extension/index~TableIndex} tableIndex TableIndex
 * @return {Promise} resolved when complete
 */
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

/**
 * Indexes a chunk of 100 rows
 * @param  {Number} page       page to start on
 * @param  {module:extension/index~TableIndex} tableIndex TableIndex
 * @param  {Function} resolve    function to call when all chunks are indexed
 * @param  {Function} reject     called if there is an error
 */
FeatureTableIndex.prototype.indexChunk = function(page, tableIndex, resolve, reject) {
  var rows = this.featureDao.queryForChunk(100, page);
  if (rows.length) {
    this.progress('Indexing ' + (page * 100) + ' to ' + ((page+1) * 100));
    console.log('Indexing ' + (page * 100) + ' to ' + ((page+1) * 100));
    rows.forEach(function(row) {
      var fr = this.featureDao.getRow(row);
      this.indexRow(tableIndex, fr.getId(), fr.getGeometry());
    }.bind(this));
    setTimeout(function() {
      this.indexChunk(++page, tableIndex, resolve, reject);
    }.bind(this));
  } else {
    resolve();
  }
}

/**
 * Indexes a row
 * @param  {module:extension/index~TableIndex} tableIndex TableIndex`
 * @param  {Number} geomId     id of the row
 * @param  {module:geom/geometryData~GeometryData} geomData   GeometryData to index
 * @return {Boolean} success
 */
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

/**
 * Update the last time this feature table was indexed
 * @param  {module:extension/index~TableIndex} tableIndex TableIndex
 * @return {Object} update status
 */
FeatureTableIndex.prototype.updateLastIndexed = function(tableIndex) {
  if (!tableIndex) {
    tableIndex = new TableIndex();
    tableIndex.table_name = this.tableName;
  }
  tableIndex.last_indexed = new Date().toISOString();
  var updateIndex = this.tableIndexDao.createOrUpdate(tableIndex);
  return updateIndex;
}

/**
 * Query the index with the specified bounding box and projection
 * @param  {module:boundingBox~BoundingBox} boundingBox bounding box to query for
 * @param  {string} projection  projection the boundingBox is in
 * @return {Iterable}
 */
FeatureTableIndex.prototype.queryWithBoundingBox = function(boundingBox, projection) {
  var projectedBoundingBox = boundingBox.projectBoundingBox(projection, this.featureDao.projection);
  var envelope = projectedBoundingBox.buildEnvelope();
  return this.queryWithGeometryEnvelope(envelope);
}

/**
 * Query witha geometry envelope
 * @param  {Envelope} envelope envelope
 * @return {Iterable}
 */
FeatureTableIndex.prototype.queryWithGeometryEnvelope = function(envelope) {
  if (this.rtreeIndexed) {
    return this.rtreeIndexDao.queryWithGeometryEnvelope(envelope);
  } else {
    return this.geometryIndexDao.queryWithGeometryEnvelope(envelope);
  }
}


/**
 * Count the index with the specified bounding box and projection
 * @param  {module:boundingBox~BoundingBox} boundingBox bounding box to query for
 * @param  {string} projection  projection the boundingBox is in
 * @return {Number}
 */
FeatureTableIndex.prototype.countWithBoundingBox = function(boundingBox, projection) {
  var projectedBoundingBox = boundingBox.projectBoundingBox(projection, this.featureDao.projection);
  var envelope = projectedBoundingBox.buildEnvelope();
  return this.countWithGeometryEnvelope(envelope);
};

/**
 * Count with a geometry envelope
 * @param  {Envelope} envelope envelope
 * @return {Number}
 */
FeatureTableIndex.prototype.countWithGeometryEnvelope = function(envelope) {
  if (this.rtreeIndexed) {
    return this.rtreeIndexDao.countWithGeometryEnvelope(envelope);
  } else {
    return this.geometryIndexDao.countWithGeometryEnvelope(envelope);
  }
};

FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_AUTHOR = 'nga';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_NAME_NO_AUTHOR = 'geometry_index';
FeatureTableIndex.EXTENSION_GEOMETRY_INDEX_DEFINITION = 'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';

module.exports = FeatureTableIndex;
