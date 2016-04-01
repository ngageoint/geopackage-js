/**
 * SpatialReferenceSystem module.
 * @module dao/spatialReferenceSystem
 * @see module:dao/dao
 */

var Dao = require('./dao');

var util = require('util');

/**
 * Spatial Reference System object. The coordinate reference system definitions
 * it contains are referenced by the GeoPackage {@link Contents} and
 * {@link GeometryColumns} objects to relate the vector and tile data in user
 * tables to locations on the earth.
 * @class SpatialReferenceSystem
 * @extends {module:dao/dao~Dao}
 */
var SpatialReferenceSystem = function(db) {
  Dao.call(this, db);

  /**
   * Human readable name of this SRS
   * @member {string}
   */
  this.srsName;
  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   * @member {Number}
   */
  this.srsId;

  /**
   * Case-insensitive name of the defining organization e.g. EPSG or epsg
   * @member {string}
   */
  this.organization;

  /**
   * Numeric ID of the Spatial Reference System assigned by the organization
   * @member {Number}
   */
  this.organizationCoordsysId;

  /**
   * Well-known Text [32] Representation of the Spatial Reference System
   * @member {string}
   */
  this.definition;

  /**
   * Human readable description of this SRS
   * @member {string}
   */
  this.description;

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


}

util.inherits(SpatialReferenceSystem, Dao);

// var SpatialReferenceSystem = Dao;

/**
 * Table Name
 * @type {String}
 */
SpatialReferenceSystem.tableName = 'gpkg_spatial_ref_sys';

/**
 * srsName field name
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_SRS_NAME = "srs_name";

/**
 * srsId field name
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_SRS_ID = "srs_id";

/**
 * id field name, srsId
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_ID = SpatialReferenceSystem.COLUMN_SRS_ID;

/**
 * organization field name
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_ORGANIZATION = "organization";

/**
 * organizationCoordsysId field name
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_ORGANIZATION_COORDSYS_ID = "organization_coordsys_id";

/**
 * definition field name
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_DEFINITION = "definition";

/**
 * description field name
 * @type {String}
 */
SpatialReferenceSystem.COLUMN_DESCRIPTION = "description";

module.exports = SpatialReferenceSystem;
