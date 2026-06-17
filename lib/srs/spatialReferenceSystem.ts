import { Projection, ProjectionConstants, Projections } from '@ngageoint/projections-js';
import { GeoPackageConstants } from '../geoPackageConstants';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';

/**
 * Spatial Reference System object. The coordinate reference system definitions it contains are referenced by the GeoPackage Contents and GeometryColumns objects to relate the vector and tile data in user tables to locations on the earth.
 * @class SpatialReferenceSystem
 */
export class SpatialReferenceSystem {
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
   * Default Constructor
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof SpatialReferenceSystem) {
      this.srs_name = args[0].srs_name;
      this.srs_id = args[0].srs_id;
      this.organization = args[0].organization;
      this.organization_coordsys_id = args[0].organization_coordsys_id;
      this.definition = args[0].definition;
      this.description = args[0].description;
      this.definition_12_063 = args[0].definition_12_063;
    }
  }

  /**
   * Get the id
   *
   * @return id
   */
  public getId(): number {
    return this.srs_id;
  }

  /**
   * Set the id
   *
   * @param id id
   */
  public setId(id: number): void {
    this.srs_id = id;
  }

  /**
   * Get the srs name
   *
   * @return srs name
   */
  public getSrsName(): string {
    return this.srs_name;
  }

  /**
   * Set the srs name
   *
   * @param srs_name srs name
   */
  public setSrsName(srs_name: string): void {
    this.srs_name = srs_name;
  }

  /**
   * Get the srs id
   *
   * @return srs id
   */
  public getSrsId(): number {
    return this.srs_id;
  }

  /**
   * Set the srs id
   *
   * @param srs_id srs id
   */
  public setSrsId(srs_id: number): void {
    this.srs_id = srs_id;
  }

  /**
   * Get the organization
   *
   * @return organization
   */
  public getOrganization(): string {
    return this.organization;
  }

  /**
   * Set the organization
   *
   * @param organization organization
   */
  public setOrganization(organization: string): void {
    this.organization = organization;
  }

  /**
   * Get the organization coordsys id
   *
   * @return organization coordsys id
   */
  public getOrganizationCoordsysId(): number {
    return this.organization_coordsys_id;
  }

  /**
   * Set the organization coordsys id
   *
   * @param organization_coordsys_id organization coordsys id
   */
  public setOrganizationCoordsysId(organization_coordsys_id: number): void {
    this.organization_coordsys_id = organization_coordsys_id;
  }

  /**
   * Get the definition
   *
   * @return definition
   */
  public getDefinition(): string {
    return this.definition;
  }

  /**
   * Set the definition
   *
   * @param definition definition
   */
  public setDefinition(definition: string): void {
    this.definition = definition;
  }

  /**
   * Get the description
   *
   * @return description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Set the description
   *
   * @param description description
   */
  public setDescription(description: string): void {
    this.description = description;
  }

  /**
   * Get the 12_063 WKT definition
   *
   * @return 12_06 3WKT definition
   */
  public getDefinition_12_063(): string {
    return this.definition_12_063;
  }

  /**
   * Set the 12_063 WKT definition
   *
   * @param definition_12_063 12_063 WKT definition
   */
  public setDefinition_12_063(definition_12_063: string): void {
    this.definition_12_063 = definition_12_063;
  }

  /**
   * Get the projection for the Spatial Reference System
   *
   * @return projection
   */
  public getProjection(): Projection {
    if (this.organization === 'NONE') return null;
    if (
      this.organization != null &&
      this.organization.toUpperCase() === ProjectionConstants.AUTHORITY_EPSG &&
      (this.organization_coordsys_id === ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM ||
        this.organization_coordsys_id === ProjectionConstants.EPSG_WEB_MERCATOR)
    ) {
      return Projections.getProjection(ProjectionConstants.AUTHORITY_EPSG, this.organization_coordsys_id);
    } else if (
      this.definition_12_063 &&
      this.definition_12_063.trim().length !== 0 &&
      this.definition_12_063 !== GeoPackageConstants.UNDEFINED_DEFINITION
    ) {
      return Projections.getProjection(this.organization, this.organization_coordsys_id, this.definition_12_063);
    } else if (
      this.definition &&
      this.definition.trim().length !== 0 &&
      this.definition !== GeoPackageConstants.UNDEFINED_DEFINITION
    ) {
      return Projections.getProjection(this.organization, this.organization_coordsys_id, this.definition);
    }
    return null;
  }

  /**
   * Get the projection definition
   *
   * @return definition
   */
  public getProjectionDefinition(): string {
    let definition = this.getDefinition_12_063();
    if (
      definition == null ||
      definition.trim().length === 0 ||
      definition.trim() === GeoPackageConstants.UNDEFINED_DEFINITION
    ) {
      definition = this.getDefinition();
      if (
        definition == null ||
        definition.trim().length === 0 ||
        definition.trim() === GeoPackageConstants.UNDEFINED_DEFINITION
      ) {
        definition = null;
      }
    }
    return definition;
  }

  /**
   * Get the projection transform from the provided projection to the Spatial
   * Reference System projection
   *
   * @param projection
   *            from projection
   * @return projection transform
   */
  public getTransformation(projection: Projection): GeometryTransform {
    return GeometryTransform.create(projection, this.getProjection());
  }

  /**
   * Return the proj4 projection specified by this SpatialReferenceSystem
   * @return {*}
   */
  get projection(): Projection {
    let projection = null;
    const organization = this.organization != null ? this.organization.toUpperCase() : undefined;
    const orgCoordSysId = this.organization_coordsys_id != null ? this.organization_coordsys_id : undefined;
    if (organization === 'NONE') return null;
    if (organization != null && orgCoordSysId != null) {
      try {
        projection = Projections.getProjection(organization, orgCoordSysId);
      } catch (e) {}
    }
    if (projection == null) {
      if (this.definition_12_063 && this.definition_12_063 !== '' && this.definition_12_063 !== 'undefined') {
        projection = Projections.getProjection(organization, orgCoordSysId, this.definition_12_063);
      } else if (this.definition && this.definition !== '' && this.definition !== 'undefined') {
        projection = Projections.getProjection(organization, orgCoordSysId, this.definition);
      }
    }
    return projection;
  }
}
