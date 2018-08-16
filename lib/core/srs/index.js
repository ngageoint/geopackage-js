/**
 * SpatialReferenceSystem module.
 * @module dao/spatialReferenceSystem
 * @see module:dao/dao
 */

var Dao = require('../../dao/dao');

var util = require('util')
  , proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class SpatialReferenceSystem
 */
var SpatialReferenceSystem = function() {
  /**
   * Human readable name of this SRS
   * @member {string}
   */
  this.srs_name;
  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   * @member {Number}
   */
  this.srs_id;

  /**
   * Case-insensitive name of the defining organization e.g. EPSG or epsg
   * @member {string}
   */
  this.organization;

  /**
   * Numeric ID of the Spatial Reference System assigned by the organization
   * @member {Number}
   */
  this.organization_coordsys_id;

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

  /**
   * Well-known Text Representation of the Spatial Reference System
   * @member {string}
   */
  this.definition_12_063;
};

SpatialReferenceSystem.prototype.getProjection = function() {
  if(this.organization_coordsys_id === 4326 && (this.organization === 'EPSG' || this.organization === 'epsg')) {
    return proj4('EPSG:4326');
  } else if (this.definition && this.definition !== '' && this.definition !== 'undefined') {
      return proj4(this.definition);
  } else if (this.organization && this.organization_coordsys_id) {
    return proj4(this.organization.toUpperCase() + ':' + this.organization_coordsys_id);
  } else {
    return {};
  }
}

/**
 * Spatial Reference System Data Access Object
 * @class SpatialReferenceSystemDao
 * @extends {module:dao/dao~Dao}
 */
var SpatialReferenceSystemDao = function(connection) {
  Dao.call(this, connection);
}

util.inherits(SpatialReferenceSystemDao, Dao);

SpatialReferenceSystemDao.prototype.createObject = function () {
  return new SpatialReferenceSystem();
};

/**
 * Get the Spatial Reference System for the provided id
 * @param  {Number}   srsId srs id
 * @param {callback} callback called with an error if one occurred and the SpatialReferenceSystem if one exists in this GeoPackage with the id
 */
SpatialReferenceSystemDao.prototype.getBySrsId = function(srsId) {
  return this.queryForIdObject(srsId);
};

SpatialReferenceSystemDao.prototype.getProjection = function (srs) {
  if(srs.organization_coordsys_id === 4326 && (srs.organization === 'EPSG' || srs.organization === 'epsg')) {
    return proj4('EPSG:4326');
  }

  try {
    if (srs.organization && srs.organization_coordsys_id) {
      return proj4(srs.organization.toUpperCase() + ':' + srs.organization_coordsys_id);
    }
  } catch (e) {}

  if (srs.definition && srs.definition !== '' && srs.definition !== 'undefined') {
    return proj4(srs.definition);
  } else {
    return {};
  }
};

/**
 * Creates the required EPSG WGS84 Spatial Reference System (spec
 * Requirement 11)
 *
 * @param {callback} callback called with an error if one occurred and the wgs84 srs
 */
SpatialReferenceSystemDao.prototype.createWgs84 = function() {
  var srs = this.getBySrsId(4326);
  if (srs) {
    return srs;
  }
  var srs = new SpatialReferenceSystem();
  srs.srs_name = 'WGS 84 geodetic';
  srs.srs_id = 4326;
  srs.organization = 'EPSG';
  srs.organization_coordsys_id = 4326;
  srs.definition = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
  srs.description = 'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid';
  if (this.connection.columnAndTableExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
    srs.definition_12_063 = 'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
  }
  return this.create(srs);
}

/**
 * Creates the required Undefined Cartesian Spatial Reference System (spec
 * Requirement 11)
 *
 * @param {callback} callback called with an error if one occurred and the undefined cartesian srs
 */
SpatialReferenceSystemDao.prototype.createUndefinedCartesian = function() {
  var srs = this.getBySrsId(-1);
  if (srs) {
    return srs;
  }
  var srs = new SpatialReferenceSystem();
  srs.srs_name = 'Undefined cartesian SRS';
  srs.srs_id = -1;
  srs.organization = 'NONE';
  srs.organization_coordsys_id = -1;
  srs.definition = 'undefined';
  srs.description = 'undefined cartesian coordinate reference system';
  if (this.connection.columnAndTableExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
    srs.definition_12_063 = 'undefined';
  }
  return this.create(srs);
}

/**
 * Creates the required Undefined Geographic Spatial Reference System (spec
 * Requirement 11)
 *
 * @param {callback} callback called with an error if one occurred and the undefined Geographic srs
 */
SpatialReferenceSystemDao.prototype.createUndefinedGeographic = function() {
  var srs = this.getBySrsId(0);
  if (srs) {
    return srs;
  }
  var srs = new SpatialReferenceSystem();
  srs.srs_name = 'Undefined geographic SRS';
  srs.srs_id = 0;
  srs.organization = 'NONE';
  srs.organization_coordsys_id = 0;
  srs.definition = 'undefined';
  srs.description = 'undefined geographic coordinate reference system';
  if (this.connection.columnAndTableExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
    srs.definition_12_063 = 'undefined';
  }
  return this.create(srs);
}

/**
 * Creates the Web Mercator Spatial Reference System if it does not already
 * exist
 *
 * @param {callback} callback called with an error if one occurred and the Web Mercator srs
 */
SpatialReferenceSystemDao.prototype.createWebMercator = function() {
  var srs = this.getBySrsId(3857);
  if (srs) {
    return srs;
  }
  var srs = new SpatialReferenceSystem();
  srs.srs_name = 'WGS 84 / Pseudo-Mercator';
  srs.srs_id = 3857;
  srs.organization = 'EPSG';
  srs.organization_coordsys_id = 3857;
  srs.definition = 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
  srs.description = 'Spherical Mercator projection coordinate system';
  if(this.connection.columnAndTableExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
    srs.definition_12_063 = 'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
  }
  return this.create(srs);
}

SpatialReferenceSystemDao.TABLE_NAME = 'gpkg_spatial_ref_sys';

/**
 * Table Name
 * @type {String}
 */
SpatialReferenceSystemDao.prototype.gpkgTableName = SpatialReferenceSystemDao.TABLE_NAME;

/**
 * srsName field name
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_SRS_NAME = "srs_name";

/**
 * srsId field name
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_SRS_ID = "srs_id";

/**
 * id field name, srsId
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_ID = SpatialReferenceSystemDao.COLUMN_SRS_ID;

/**
 * organization field name
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_ORGANIZATION = "organization";

/**
 * organizationCoordsysId field name
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_ORGANIZATION_COORDSYS_ID = "organization_coordsys_id";

/**
 * definition field name
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_DEFINITION = "definition";

/**
 * description field name
 * @type {String}
 */
SpatialReferenceSystemDao.COLUMN_DESCRIPTION = "description";


SpatialReferenceSystemDao.prototype.idColumns = [SpatialReferenceSystemDao.COLUMN_SRS_ID];

module.exports.SpatialReferenceSystemDao = SpatialReferenceSystemDao;
SpatialReferenceSystem.TABLE_NAME = SpatialReferenceSystemDao.TABLE_NAME;
module.exports.SpatialReferenceSystem = SpatialReferenceSystem;
