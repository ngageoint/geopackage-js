import { Dao } from '../../dao/dao';

import { SpatialReferenceSystem } from './spatialReferenceSystem';
/**
 * Spatial Reference System Data Access Object
 * @extends Dao
 * @class SpatialReferenceSystemDao
 * @param {module:geoPackage~GeoPackage} geoPackage The GeoPackage object
 */
export class SpatialReferenceSystemDao extends Dao<SpatialReferenceSystem> {
  /**
   * Spatial Reference System Table Name
   * @type {String}
   */
  public static readonly TABLE_NAME: string = 'gpkg_spatial_ref_sys';

  /**
   * srsName field name
   * @type {String}
   */
  public static readonly COLUMN_SRS_NAME: string = 'srs_name';

  /**
   * srsId field name
   * @type {String}
   */
  public static readonly COLUMN_SRS_ID: string = 'srs_id';

  /**
   * id field name, srsId
   * @type {String}
   */
  public static readonly COLUMN_ID: string = SpatialReferenceSystemDao.COLUMN_SRS_ID;

  /**
   * organization field name
   * @type {String}
   */
  public static readonly COLUMN_ORGANIZATION: string = 'organization';

  /**
   * organizationCoordsysId field name
   * @type {String}
   */
  public static readonly COLUMN_ORGANIZATION_COORDSYS_ID: string = 'organization_coordsys_id';

  /**
   * definition field name
   * @type {String}
   */
  public static readonly COLUMN_DEFINITION: string = 'definition';

  /**
   * description field name
   * @type {String}
   */
  public static readonly COLUMN_DESCRIPTION: string = 'description';

  readonly idColumns: string[] = [SpatialReferenceSystemDao.COLUMN_SRS_ID];
  /**
   * Table Name
   * @type {String}
   */
  readonly gpkgTableName: string = SpatialReferenceSystemDao.TABLE_NAME;
  /**
   * Create a new SpatialReferenceSystem object
   * @return {module:core/srs~SpatialReferenceSystem}
   */
  createObject(): SpatialReferenceSystem {
    return new SpatialReferenceSystem();
  }
  /**
   * Get the Spatial Reference System for the provided id
   * @param  {Number}   srsId srs id
   * @return {module:core/srs~SpatialReferenceSystem}
   */
  getBySrsId(srsId: number): SpatialReferenceSystem {
    return this.queryForId(srsId);
  }
  /**
   * Return the proj4 projection specified by this SpatialReferenceSystem
   * @return {typeof proj4}
   */
  getProjection(srs: SpatialReferenceSystem): any {
    return srs.getProjection();
  }
  /**
   * Creates the required EPSG WGS84 Spatial Reference System (spec
   * Requirement 11)
   * @return {Number} id of the created row
   */
  createWgs84(): number {
    let srs = this.getBySrsId(4326);
    if (srs) {
      return srs.srs_id;
    }
    srs = new SpatialReferenceSystem();
    srs.srs_name = 'WGS 84 geodetic';
    srs.srs_id = 4326;
    srs.organization = 'EPSG';
    srs.organization_coordsys_id = 4326;
    srs.definition =
      'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
    srs.description = 'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid';
    if (this.connection.columnAndTableExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
      srs.definition_12_063 =
        'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
    }
    return this.create(srs);
  }
  /**
   * Creates the required Undefined Cartesian Spatial Reference System (spec
   * Requirement 11)
   * @return {Number} id of the created row
   */
  createUndefinedCartesian(): number {
    let srs = this.getBySrsId(-1);
    if (srs) {
      return srs.srs_id;
    }
    srs = new SpatialReferenceSystem();
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
   * @return {Number} id of the created row
   */
  createUndefinedGeographic(): number {
    let srs = this.getBySrsId(0);
    if (srs) {
      return srs.srs_id;
    }
    srs = new SpatialReferenceSystem();
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
   * @return {Number} id of the created row
   */
  createWebMercator(): number {
    let srs = this.getBySrsId(3857);
    if (srs) {
      return srs.srs_id;
    }
    srs = new SpatialReferenceSystem();
    srs.srs_name = 'WGS 84 / Pseudo-Mercator';
    srs.srs_id = 3857;
    srs.organization = 'EPSG';
    srs.organization_coordsys_id = 3857;
    srs.definition =
      'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
    srs.description = 'Spherical Mercator projection coordinate system';
    if (this.connection.columnAndTableExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
      srs.definition_12_063 =
        'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
    }
    return this.create(srs);
  }
}
