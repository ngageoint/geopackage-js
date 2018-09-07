/**
 * RTreeIndexDao module.
 * @module RTreeIndexDao
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao')
  , BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension
  , EnvelopeBuilder = require('../../geom/envelopeBuilder')
  , GeometryData = require('../../geom/geometryData');

var util = require('util');

var RTreeIndex = function(geoPackage, featureDao) {
  BaseExtension.call(this, geoPackage);

  this.extensionName = Extension.buildExtensionName(RTreeIndexDao.EXTENSION_RTREE_INDEX_AUTHOR, RTreeIndexDao.EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR);

  this.extensionDefinition = RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION;

  this.tableName = featureDao.table_name;
  this.primaryKeyColumn = featureDao.idColumns[0];
  this.columnName = featureDao.getGeometryColumnName();

  this.rtreeIndexDao = new RTreeIndexDao(geoPackage, featureDao);
  this.extensionExists = this.hasExtension(this.extensionName, this.tableName, this.columnName);
}

util.inherits(RTreeIndex, BaseExtension);

RTreeIndex.prototype.getRTreeIndexExtension = function () {
  return this.getExtension(this.extensionName, this.tableName, this.columnName);
};

RTreeIndex.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, this.tableName, this.columnName, this.extensionDefinition, Extension.WRITE_ONLY);
};

RTreeIndex.prototype.create = function() {
  if (this.extensionExists) {
    return Promise.resolve(this.getRTreeIndexExtension());
  }

  return this.getOrCreate(this.extensionName, this.tableName, this.columnName, RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION, Extension.WRITE_ONLY)
  .then(function() {
    this.createAllFunctions();
    this.createRTreeIndex();
    this.loadRTreeIndex();
    this.createAllTriggers();
    return this.getRTreeIndexExtension();
  }.bind(this));
}

RTreeIndex.prototype.createAllTriggers = function() {
  var insertTrigger =
  'CREATE TRIGGER rtree_'+this.tableName+'_'+this.columnName+'_insert AFTER INSERT ON '+this.tableName+
  '  WHEN (new.'+this.columnName+' NOT NULL AND NOT ST_IsEmpty(NEW.'+this.columnName+')) '+
  'BEGIN '+
  '  INSERT OR REPLACE INTO rtree_'+this.tableName+'_'+this.columnName+' VALUES ('+
  '    NEW.'+this.primaryKeyColumn+','+
  '    ST_MinX(NEW.'+this.columnName+'), ST_MaxX(NEW.'+this.columnName+'), '+
  '    ST_MinY(NEW.'+this.columnName+'), ST_MaxY(NEW.'+this.columnName+') '+
  '  ); '+
  'END;';

  var update1Trigger =
  'CREATE TRIGGER rtree_'+this.tableName+'_'+this.columnName+'_update1 AFTER UPDATE OF '+this.columnName+' ON '+this.tableName+
  '  WHEN OLD.'+this.primaryKeyColumn+' = NEW.'+this.primaryKeyColumn+' AND '+
  '     (NEW.'+this.columnName+' NOTNULL AND NOT ST_IsEmpty(NEW.'+this.columnName+')) '+
  'BEGIN '+
  '  INSERT OR REPLACE INTO rtree_'+this.tableName+'_'+this.columnName+' VALUES ('+
  '    NEW.'+this.primaryKeyColumn+','+
  '    ST_MinX(NEW.'+this.columnName+'), ST_MaxX(NEW.'+this.columnName+'), '+
  '    ST_MinY(NEW.'+this.columnName+'), ST_MaxY(NEW.'+this.columnName+') '+
  '  ); '+
  'END;';

  var update2Trigger =
  'CREATE TRIGGER rtree_'+this.tableName+'_'+this.columnName+'_update2 AFTER UPDATE OF '+this.columnName+' ON '+this.tableName+
  '  WHEN OLD.'+this.primaryKeyColumn+' = NEW.'+this.primaryKeyColumn+' AND '+
  '       (NEW.'+this.columnName+' ISNULL OR ST_IsEmpty(NEW.'+this.columnName+')) '+
  'BEGIN '+
  '  DELETE FROM rtree_'+this.tableName+'_'+this.columnName+' WHERE id = OLD.'+this.primaryKeyColumn+'; '+
  'END;';

  var update3Trigger =
  'CREATE TRIGGER rtree_'+this.tableName+'_'+this.columnName+'_update3 AFTER UPDATE OF '+this.columnName+' ON '+this.tableName+
  '  WHEN OLD.'+this.primaryKeyColumn+' != NEW.'+this.primaryKeyColumn+' AND '+
  '       (NEW.'+this.columnName+' NOTNULL AND NOT ST_IsEmpty(NEW.'+this.columnName+')) '+
  'BEGIN '+
  '  DELETE FROM rtree_'+this.tableName+'_'+this.columnName+' WHERE id = OLD.'+this.primaryKeyColumn+'; '+
  '  INSERT OR REPLACE INTO rtree_'+this.tableName+'_'+this.columnName+' VALUES ('+
  '    NEW.'+this.primaryKeyColumn+', '+
  '    ST_MinX(NEW.'+this.columnName+'), ST_MaxX(NEW.'+this.columnName+'), '+
  '    ST_MinY(NEW.'+this.columnName+'), ST_MaxY(NEW.'+this.columnName+')'+
  '  ); '+
  'END;';

  var update4Trigger =
  'CREATE TRIGGER rtree_'+this.tableName+'_'+this.columnName+'_update4 AFTER UPDATE ON '+this.tableName+
  '  WHEN OLD.'+this.primaryKeyColumn+' != NEW.'+this.primaryKeyColumn+' AND '+
  '       (NEW.'+this.columnName+' ISNULL OR ST_IsEmpty(NEW.'+this.columnName+')) '+
  'BEGIN '+
  '  DELETE FROM rtree_'+this.tableName+'_'+this.columnName+' WHERE id IN (OLD.'+this.primaryKeyColumn+', NEW.'+this.primaryKeyColumn+'); '+
  'END;';

  var deleteTrigger =
  'CREATE TRIGGER rtree_'+this.tableName+'_'+this.columnName+'_delete AFTER DELETE ON '+this.tableName+
  '  WHEN old.'+this.columnName+' NOT NULL '+
  'BEGIN'+
  '  DELETE FROM rtree_'+this.tableName+'_'+this.columnName+' WHERE id = OLD.'+this.primaryKeyColumn+'; '+
  'END;';

  this.connection.run(insertTrigger);
  this.connection.run(update1Trigger);
  this.connection.run(update2Trigger);
  this.connection.run(update3Trigger);
  this.connection.run(update4Trigger);
  this.connection.run(deleteTrigger);
}

RTreeIndex.prototype.loadRTreeIndex = function() {
  this.connection.run('INSERT OR REPLACE INTO rtree_'+this.tableName+'_'+this.columnName+' SELECT '+this.primaryKeyColumn+', st_minx('+this.columnName+'), st_maxx('+this.columnName+'), st_miny('+this.columnName+'), st_maxy('+this.columnName+') FROM '+this.tableName);
}

RTreeIndex.prototype.createRTreeIndex = function() {
  this.connection.run('CREATE VIRTUAL TABLE rtree_'+this.tableName+'_'+this.columnName+' USING rtree(id, minx, maxx, miny, maxy)');
}

RTreeIndex.prototype.createAllFunctions = function() {
  this.createMinXFunction();
	this.createMaxXFunction();
	this.createMinYFunction();
	this.createMaxYFunction();
	this.createIsEmptyFunction();
}

RTreeIndex.prototype.createMinXFunction = function() {
  this.connection.registerFunction('ST_MinX', function(buffer) {
    var geom = new GeometryData(buffer);
    var envelope = geom.envelope;
    if (!envelope) {
      envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
    }
    return envelope.minX;
  });
}

RTreeIndex.prototype.createMinYFunction = function() {
  this.connection.registerFunction('ST_MinY', function(buffer) {
    var geom = new GeometryData(buffer);
    var envelope = geom.envelope;
    if (!envelope) {
      envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
    }
    return envelope.minY;
  });
}

RTreeIndex.prototype.createMaxXFunction = function() {
  this.connection.registerFunction('ST_MaxX', function(buffer) {
    var geom = new GeometryData(buffer);
    var envelope = geom.envelope;
    if (!envelope) {
      envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
    }
    return envelope.maxX;
  });
}

RTreeIndex.prototype.createMaxYFunction = function() {
  this.connection.registerFunction('ST_MaxY', function(buffer) {
    var geom = new GeometryData(buffer);
    var envelope = geom.envelope;
    if (!envelope) {
      envelope = EnvelopeBuilder.buildEnvelopeWithGeometry(geom.geometry);
    }
    return envelope.maxY;
  });
}

RTreeIndex.prototype.createIsEmptyFunction = function() {
  this.connection.registerFunction('ST_IsEmpty', function(buffer) {
    var geom = new GeometryData(buffer);
    return !geom || geom.empty || !geom.geometry;
  });
}

/**
 * RTree Index Data Access Object
 * @class
 * @extends {module:dao/dao~Dao}
 */
var RTreeIndexDao = function(geoPackage, featureDao) {
  Dao.call(this, geoPackage);
  this.featureDao = featureDao;

};

util.inherits(RTreeIndexDao, Dao);

RTreeIndexDao.prototype.queryWithGeometryEnvelope = function(envelope) {
  var tableName = this.featureDao.gpkgTableName;

  var where = '';
  var minXLessThanMaxX = envelope.minX < envelope.maxX;
  if (minXLessThanMaxX) {
    where += this.buildWhereWithFieldAndValue('minx', envelope.maxX, '<=');
    where += ' and ';
    where += this.buildWhereWithFieldAndValue('maxx', envelope.minX, '>=');
  } else {
    where += '(';
    where += this.buildWhereWithFieldAndValue('minx', envelope.maxX, '<=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValue('maxx', envelope.minX, '>=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValue('minx', envelope.minX, '>=');
    where += ' or ';
    where += this.buildWhereWithFieldAndValue('maxx', envelope.maxX, '<=');
    where += ')';
  }

  where += ' and ';
  where += this.buildWhereWithFieldAndValue('miny', envelope.maxY, '<=');
  where += ' and ';
  where += this.buildWhereWithFieldAndValue('maxy', envelope.minY, '>=');

  var whereArgs = []
  whereArgs.push(envelope.maxX, envelope.minX);
  if (!minXLessThanMaxX) {
    whereArgs.push(envelope.minX, envelope.maxX);
  }
  whereArgs.push(envelope.maxY, envelope.minY);

  var join = 'inner join ' + tableName + ' on ' + tableName + '.' + this.featureDao.idColumns[0] + ' = ' + this.gpkgTableName+'.id';
  return this.queryJoinWhereWithArgs(join, where, whereArgs, [tableName + '.*']);
}

RTreeIndexDao.TABLE_NAME = "rtree";
RTreeIndexDao.COLUMN_TABLE_NAME = RTreeIndexDao.TABLE_NAME + ".table_name";
RTreeIndexDao.COLUMN_GEOM_ID = RTreeIndexDao.TABLE_NAME + ".geom_id";
RTreeIndexDao.COLUMN_MIN_X = RTreeIndexDao.TABLE_NAME + ".minx";
RTreeIndexDao.COLUMN_MAX_X = RTreeIndexDao.TABLE_NAME + ".maxx";
RTreeIndexDao.COLUMN_MIN_Y = RTreeIndexDao.TABLE_NAME + ".miny";
RTreeIndexDao.COLUMN_MAX_Y = RTreeIndexDao.TABLE_NAME + ".maxy";
RTreeIndexDao.COLUMN_MIN_Z = RTreeIndexDao.TABLE_NAME + ".minz";
RTreeIndexDao.COLUMN_MAX_Z = RTreeIndexDao.TABLE_NAME + ".maxz";
RTreeIndexDao.COLUMN_MIN_M = RTreeIndexDao.TABLE_NAME + ".minm";
RTreeIndexDao.COLUMN_MAX_M = RTreeIndexDao.TABLE_NAME + ".maxm";

RTreeIndexDao.EXTENSION_NAME = 'gpkg_rtree_index';
RTreeIndexDao.EXTENSION_RTREE_INDEX_AUTHOR = 'gpkg';
RTreeIndexDao.EXTENSION_RTREE_INDEX_NAME_NO_AUTHOR = 'rtree_index';
RTreeIndexDao.EXTENSION_RTREE_INDEX_DEFINITION = 'http://www.geopackage.org/spec/#extension_rtree';

RTreeIndexDao.prototype.gpkgTableName = RTreeIndexDao.TABLE_NAME;

module.exports.RTreeIndexDao = RTreeIndexDao;
module.exports.RTreeIndex = RTreeIndex;
