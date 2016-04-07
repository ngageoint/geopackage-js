/**
 * GeometryColumns module.
 * @module dao/geometryColumns
 * @see module:dao/dao
 */

var Dao = require('./dao')
  , SpatialReferenceSystemDao = require('./spatialReferenceSystem').SpatialReferenceSystemDao
  , ContentsDao = require('../core/contents').ContentsDao
  , Contents = require('../core/contents').Contents;

var util = require('util');

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class SpatialReferenceSystem
 */
var GeometryColumns = function() {
  /**
	 * Name of the table containing the geometry column
	 * @member {string}
	 */
	this.tableName;

	/**
	 * Name of a column in the feature table that is a Geometry Column
	 * @member {string}
	 */
	this.columnName;

	/**
	 * Name from Geometry Type Codes (Core) or Geometry Type Codes (Extension)
	 * in Geometry Types (Normative)
	 * @member {string}
	 */
	this.geometryTypeName;

	/**
	 * Spatial Reference System ID: gpkg_spatial_ref_sys.srs_id
	 * @member {module:dao/spatialReferenceSystem~SpatialReferenceSystem}
	 */
	this.srs;

	/**
	 * Unique identifier for each Spatial Reference System within a GeoPackage
	 * @member {Number}
	 */
	this.srsId;

	/**
	 * 0: z values prohibited; 1: z values mandatory; 2: z values optional
	 * @member {byte}
	 */
	this.z;

	/**
	 * 0: m values prohibited; 1: m values mandatory; 2: m values optional
	 * @member {byte}
	 */
	this.m;

};

GeometryColumns.prototype.populateFromResult = function (result) {
  this.tableName = result[GeometryColumnsDao.COLUMN_TABLE_NAME];
  this.columnName = result[GeometryColumnsDao.COLUMN_COLUMN_NAME];
  this.geometryTypeName = result[GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME];
  this.srs = result[GeometryColumnsDao.COLUMN_SRS_NAME];
  this.srsId = result[GeometryColumnsDao.COLUMN_SRS_ID];
  this.z = result[GeometryColumnsDao.COLUMN_Z];
  this.m = result[GeometryColumnsDao.COLUMN_M];
};

  // /**
  //  * Contents
  //  */
  // @ForeignCollectionField(eager = false)
  // private ForeignCollection<Contents> contents;
  //
  // /**
  //  * Geometry Columns
  //  */
  // @ForeignCollectionField(eager = false)
  // private ForeignCollection<GeometryColumns> geometryColumns;
  //
  // /**
  //  * Matrix Tile Set
  //  */
  // @ForeignCollectionField(eager = false)
  // private ForeignCollection<TileMatrixSet> tileMatrixSet;



/**
 * Geometry Columns Data Access Object
 * @class GeometryColumnsDao
 * @extends {module:dao/dao~Dao}
 */
var GeometryColumnsDao = function(db) {
  Dao.call(this, db);
  this.initializeColumnIndex();
}

util.inherits(GeometryColumnsDao, Dao);


GeometryColumnsDao.prototype.getValueFromObject = function (object, columnIndex) {
  switch(columnIndex) {
    case 0:
    return object.tableName;
    case 1:
    return object.columnName;
    case 2:
    return object.geometryTypeName;
    case 3:
    return object.srsId;
    case 4:
    return object.z;
    case 5:
    return object.m;
    default:
      throw new Error('Unsupported column index: ' + columnIndex);
  }
};

/**
 *  Query for the table name
 *
 *  @param {string} tableName table name
 *  @param {callback} callback called with an error if one occurred and the {module:dao/geometryColumns~GeometryColumns}
 */
GeometryColumnsDao.prototype.queryForTableName = function (tableName, callback) {
  /**
   * -(GPKGGeometryColumns *) queryForTableName: (NSString *) tableName{

    GPKGGeometryColumns *geometryColumns = nil;

    GPKGResultSet * result = [self queryForEqWithField:GPKG_GC_COLUMN_TABLE_NAME andValue:tableName];
    if([result moveToNext]){
        geometryColumns = (GPKGGeometryColumns *) [self getObject:result];
    }
    [result close];

    return geometryColumns;
}
   */
  console.log('querying for tablename', tableName);
  this.queryForEqWithFieldAndValue(GeometryColumnsDao.COLUMN_TABLE_NAME, tableName, function(err, results) {
    console.log('results', results);
    if (results) {
      var gc = new GeometryColumns();
      gc.populateFromResult(results[0]);
      return callback(err, gc);
    }
    return callback(err);
  });
};

/**
 *  Get the feature table names
 *
 *  @param {callback} callback called with an error if one occurred and an array of the {FeatureTable}
 */
GeometryColumnsDao.prototype.getFeatureTables = function (callback) {
  var tableNames = [];
  this.db.each('select ' + GeometryColumnsDao.COLUMN_TABLE_NAME + ' from ' + this.tableName, function(err, result) {
    if (err) return callback(err);
    tableNames.push(result[GeometryColumnsDao.COLUMN_TABLE_NAME]);
  }, function(err, numberOfResults) {
    callback(err, tableNames);
  });
};

/**
 *  Get the Spatial Reference System of the Geometry Columns
 *
 *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
 *  @param {callback} callback called with an error if one occurred and the {SpatialReferenceSystem}
 */
GeometryColumnsDao.prototype.getSrs = function (geometryColumns, callback) {
  var dao = this.getSpatialReferenceSystemDao();
  return dao.queryForIdObject(geometryColumns.srsId, function(err, result) {
    callback(err, result);
  });
};

/**
 *  Get the Contents of the Geometry Columns
 *
 *  @param {module:dao/geometryColumns~GeometryColumns} geometryColumns geometry columns
 *  @return {ContentsDao} contents dao
 */
GeometryColumnsDao.prototype.getContents = function (geometryColumns, callback) {
  var dao = this.getContentsDao();
  return dao.queryForIdObject(geometryColumns.tableName, function(err, result) {
    var contents = new Contents();
    contents.populateFromResult(result);
    callback(err, contents);
  });
};

GeometryColumnsDao.prototype.getSpatialReferenceSystemDao = function () {
  return new SpatialReferenceSystemDao(this.db);
};

GeometryColumnsDao.prototype.getContentsDao = function () {
  return new ContentsDao(this.db);
};

GeometryColumnsDao.prototype.getProjection = function (projectionObject) {
  // var srs = this.getSrs(projectionObject);
  // var srsDao = this.getSpatialReferenceSystemDao();
  // TODO
  return {};
};

/**
 * tableName field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_TABLE_NAME = "table_name";

/**
 * columnName field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_COLUMN_NAME = "column_name";

/**
 * id 1 field name, tableName
 * @type {String}
 */
GeometryColumnsDao.COLUMN_ID_1 = GeometryColumnsDao.COLUMN_TABLE_NAME;

/**
 * id 2 field name, columnName
 * @type {String}
 */
GeometryColumnsDao.COLUMN_ID_2 = GeometryColumnsDao.COLUMN_COLUMN_NAME;

/**
 * geometryTypeName field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME = "geometry_type_name";

/**
 * srsId field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_SRS_ID = GeometryColumnsDao.COLUMN_SRS_ID;

/**
 * z field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_Z = "z";

/**
 * m field name
 * @type {String}
 */
GeometryColumnsDao.COLUMN_M = "m";

/**
 * Table Name
 * @type {String}
 */
GeometryColumnsDao.prototype.tableName = 'gpkg_geometry_columns';

GeometryColumnsDao.prototype.idColumns = [GeometryColumnsDao.COLUMN_ID_1, GeometryColumnsDao.COLUMN_ID_2];
GeometryColumnsDao.prototype.columns =
  [GeometryColumnsDao.COLUMN_TABLE_NAME, GeometryColumnsDao.COLUMN_COLUMN_NAME, GeometryColumnsDao.COLUMN_GEOMETRY_TYPE_NAME, GeometryColumnsDao.COLUMN_SRS_ID, GeometryColumnsDao.COLUMN_Z, GeometryColumnsDao.COLUMN_M];

module.exports.GeometryColumnsDao = GeometryColumnsDao;
module.exports.GeometryColumns = GeometryColumns;
