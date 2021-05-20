/* eslint-disable camelcase */
/**
 * SpatialReferenceSystem module.
 * @module core/srs
 */
import proj4 from 'proj4';
import { Projection } from '../../projection/projection';
import { ProjectionConstants } from '../../projection/projectionConstants';

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class SpatialReferenceSystem
 */
export class SpatialReferenceSystem {
  public static readonly TABLE_NAME = 'gpkg_spatial_ref_sys';
  /**
   * Human readable name of this SRS
   * @type {string}
   */
  srs_name: string;
  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   * @type {Number}
   */
  srs_id: number;
  /**
   * Case-insensitive name of the defining organization e.g. EPSG or epsg
   * @type {string}
   */
  organization: string;
  /**
   * Numeric ID of the Spatial Reference System assigned by the organization
   * @type {Number}
   */
  organization_coordsys_id: number;
  /**
   * Well-known Text [32] Representation of the Spatial Reference System
   * @type {string}
   */
  definition: string;
  /**
   * Human readable description of this SRS
   * @type {string}
   */
  description: string;
  /**
   * Well-known Text Representation of the Spatial Reference System
   * @type {string}
   */
  definition_12_063: string;

  /**
   * Return the proj4 projection specified by this SpatialReferenceSystem
   * @return {*}
   */
  get projection(): proj4.Converter {
    if (this.organization === 'NONE') return null;
    if (!!this.organization && this.organization.toUpperCase() === ProjectionConstants.EPSG && (this.organization_coordsys_id === ProjectionConstants.EPSG_CODE_4326 || this.organization_coordsys_id === ProjectionConstants.EPSG_CODE_3857)) {
      return Projection.getEPSGConverter(this.organization_coordsys_id);
    } else if (this.definition_12_063 && this.definition_12_063 !== '' && this.definition_12_063 !== 'undefined') {
      return Projection.getConverter(this.definition_12_063);
    } else if (this.definition && this.definition !== '' && this.definition !== 'undefined') {
      return Projection.getConverter(this.definition);
    }
    return null;
  }
}
