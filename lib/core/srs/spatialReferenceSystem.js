/* eslint-disable camelcase */
/**
 * SpatialReferenceSystem module.
 * @module core/srs
 */

var proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class SpatialReferenceSystem
 */
class SpatialReferenceSystem {
  constructor() {
    /**
     * Human readable name of this SRS
     * @type {string}
     */
    this.srs_name = undefined;
    /**
     * Unique identifier for each Spatial Reference System within a GeoPackage
     * @type {Number}
     */
    this.srs_id = undefined;
    /**
     * Case-insensitive name of the defining organization e.g. EPSG or epsg
     * @type {string}
     */
    this.organization = undefined;
    /**
     * Numeric ID of the Spatial Reference System assigned by the organization
     * @type {Number}
     */
    this.organization_coordsys_id = undefined;
    /**
     * Well-known Text [32] Representation of the Spatial Reference System
     * @type {string}
     */
    this.definition = undefined;
    /**
     * Human readable description of this SRS
     * @type {string}
     */
    this.description = undefined;
    /**
     * Well-known Text Representation of the Spatial Reference System
     * @type {string}
     */
    this.definition_12_063 = undefined;
  }
  /**
   * Return the proj4 projection specified by this SpatialReferenceSystem
   * @return {*}
   */
  getProjection() {
    if (this.organization === 'NONE')
      return {};
    if (this.organization_coordsys_id === 4326 && (this.organization === 'EPSG' || this.organization === 'epsg')) {
      return proj4('EPSG:4326');
    }
    else if (this.definition_12_063 && this.definition_12_063 !== '' && this.definition_12_063 !== 'undefined') {
      return proj4(this.definition_12_063);
    }
    else if (this.definition && this.definition !== '' && this.definition !== 'undefined') {
      return proj4(this.definition);
    }
    else if (this.organization && this.organization_coordsys_id) {
      return proj4(this.organization.toUpperCase() + ':' + this.organization_coordsys_id);
    }
    return {};
  }
}

SpatialReferenceSystem.TABLE_NAME = 'gpkg_spatial_ref_sys';
module.exports = SpatialReferenceSystem;
