import { SpatialReferenceSystem } from './spatialReferenceSystem';
import { DBValue } from '../db/dbValue';
import { FieldValues } from '../dao/fieldValues';
import { Projection, ProjectionConstants } from '@ngageoint/projections-js';
import { GeoPackageDao } from '../db/geoPackageDao';
import { Contents } from '../contents/contents';
import { GeometryColumns } from '../features/columns/geometryColumns';
import { TileMatrixSet } from '../tiles/matrixset/tileMatrixSet';
import { SpatialReferenceSystemConstants } from './spatialReferenceSystemConstants';
import { CrsWktExtension } from '../extension/crsWktExtension';
import { GeoPackageException } from '../geoPackageException';
import type { GeoPackage } from '../geoPackage';

/**
 * Spatial Reference System Data Access Object
 */
export class SpatialReferenceSystemDao extends GeoPackageDao<SpatialReferenceSystem, number> {
  readonly idColumns: string[] = [SpatialReferenceSystemConstants.COLUMN_SRS_ID];
  /**
   * Table Name
   * @type {String}
   */
  readonly gpkgTableName: string = SpatialReferenceSystemConstants.TABLE_NAME;

  /**
   * CRS WKT Extension
   */
  private crsWktExtension: CrsWktExtension;

  /**
   *
   * @param geoPackage GeoPackageConnection object this dao belongs to
   */
  constructor(readonly geoPackage: GeoPackage) {
    super(geoPackage, SpatialReferenceSystemConstants.TABLE_NAME);
  }

  public static createDao(geoPackage: GeoPackage): SpatialReferenceSystemDao {
    return new SpatialReferenceSystemDao(geoPackage);
  }

  queryForIdWithKey(key: number): SpatialReferenceSystem {
    return this.queryForId(key);
  }

  /**
   * Create a new SpatialReferenceSystem object
   * @return {SpatialReferenceSystem}
   */
  createObject(results?: Record<string, DBValue>): SpatialReferenceSystem {
    const srs = new SpatialReferenceSystem();
    if (results) {
      srs.setSrsName(results.srs_name as string);
      srs.setSrsId(results.srs_id as number);
      srs.setOrganization(results.organization as string);
      srs.setOrganizationCoordsysId(results.organization_coordsys_id as number);
      srs.setDefinition(results.definition as string);
      srs.setDefinition_12_063(results.definition as string);
      srs.setDescription(results.description as string);
    }
    return srs;
  }

  /**
   * Set the CRS WKT Extension
   * @param crsWktExtension CRS WKT Extension
   */
  public setCrsWktExtension(crsWktExtension: CrsWktExtension): void {
    this.crsWktExtension = crsWktExtension;
  }

  /**
   * Creates the required EPSG WGS84 Spatial Reference System (spec
   * Requirement 11)
   * @return {Number} id of the created row
   */
  createWgs84(): SpatialReferenceSystem {
    let srs = this.getBySrsId(ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM);
    if (!srs) {
      srs = new SpatialReferenceSystem();
      srs.srs_name = 'WGS 84 geodetic';
      srs.srs_id = ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM;
      srs.organization = ProjectionConstants.AUTHORITY_EPSG;
      srs.organization_coordsys_id = ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM;
      srs.definition =
        'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]';
      srs.description = 'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid';
      if (this.db.columnExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
        srs.definition_12_063 = SpatialReferenceSystemConstants.WORLD_GEODETIC_DEFINITION_12_063;
      }
      this.create(srs);
    }
    return srs;
  }
  /**
   * Creates the required Undefined Cartesian Spatial Reference System (spec
   * Requirement 11)
   * @return {Number} id of the created row
   */
  createUndefinedCartesian(): SpatialReferenceSystem {
    let srs = this.getBySrsId(-1);
    if (!srs) {
      srs = new SpatialReferenceSystem();
      srs.srs_name = 'Undefined cartesian SRS';
      srs.srs_id = -1;
      srs.organization = ProjectionConstants.AUTHORITY_NONE;
      srs.organization_coordsys_id = ProjectionConstants.UNDEFINED_CARTESIAN;
      srs.definition = 'undefined';
      srs.description = 'undefined cartesian coordinate reference system';
      if (this.db.columnExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
        srs.definition_12_063 = SpatialReferenceSystemConstants.UNDEFINED_CARTESIAN_DEFINITION_12_063;
      }
      this.create(srs);
    }
    return srs;
  }
  /**
   * Creates the required Undefined Geographic Spatial Reference System (spec
   * Requirement 11)
   * @return {Number} id of the created row
   */
  createUndefinedGeographic(): SpatialReferenceSystem {
    let srs = this.getBySrsId(0);
    if (!srs) {
      srs = new SpatialReferenceSystem();
      srs.srs_name = 'Undefined geographic SRS';
      srs.srs_id = 0;
      srs.organization = ProjectionConstants.AUTHORITY_NONE;
      srs.organization_coordsys_id = ProjectionConstants.UNDEFINED_GEOGRAPHIC;
      srs.definition = 'undefined';
      srs.description = 'undefined geographic coordinate reference system';
      if (this.db.columnExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
        srs.definition_12_063 = SpatialReferenceSystemConstants.UNDEFINED_GEOGRAPHIC_DEFINITION_12_063;
      }
      this.create(srs);
    }
    return srs;
  }
  /**
   * Creates the Web Mercator Spatial Reference System if it does not already
   * exist
   * @return {Number} id of the created row
   */
  createWebMercator(): SpatialReferenceSystem {
    let srs = this.getByOrganizationAndCoordSysId(
      ProjectionConstants.AUTHORITY_EPSG,
      ProjectionConstants.EPSG_WEB_MERCATOR,
    );
    if (!srs) {
      srs = new SpatialReferenceSystem();
      srs.srs_name = 'WGS 84 / Pseudo-Mercator';
      srs.srs_id = ProjectionConstants.EPSG_WEB_MERCATOR;
      srs.organization = ProjectionConstants.AUTHORITY_EPSG;
      srs.organization_coordsys_id = ProjectionConstants.EPSG_WEB_MERCATOR;
      srs.definition =
        'PROJCS["WGS 84 / Pseudo-Mercator",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Mercator_1SP"],PARAMETER["central_meridian",0],PARAMETER["scale_factor",1],PARAMETER["false_easting",0],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["X",EAST],AXIS["Y",NORTH],EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs"],AUTHORITY["EPSG","3857"]]';
      srs.description = 'Spherical Mercator projection coordinate system';
      if (this.db.columnExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
        srs.definition_12_063 = SpatialReferenceSystemConstants.WEB_MERCATOR_DEFINITION_12_063;
      }
      this.create(srs);
    }
    return srs;
  }

  /**
   * Creates the required EPSG WGS84 Geographical 3D Spatial Reference System
   *
   * @return spatial reference system
   * @throws SQLException upon creation failure
   */
  public createWgs84Geographical3D(): SpatialReferenceSystem {
    let srs = this.getByOrganizationAndCoordSysId(ProjectionConstants.AUTHORITY_EPSG, 4979);
    if (!srs) {
      srs = new SpatialReferenceSystem();
      srs.srs_name = 'WGS 84 Geographic 3D';
      srs.srs_id = 4979;
      srs.organization = 'EPSG';
      srs.organization_coordsys_id = 4979;
      srs.definition =
        'GEOGCS["WGS 84",DATUM["World Geodetic System 1984",SPHEROID["WGS 84",6378137.0,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0.0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.017453292519943295],AXIS["Geodetic latitude",NORTH],AXIS["Geodetic longitude",EAST],AXIS["Ellipsoidal height",UP],AUTHORITY["EPSG","4979"]]';
      srs.description = 'Used by the GPS satellite navigation system.';
      if (this.db.columnExists('gpkg_spatial_ref_sys', 'definition_12_063')) {
        srs.definition_12_063 = SpatialReferenceSystemConstants.WGS84_3D_DEFINITION_12_063;
      }
      this.create(srs);
    }
    return srs;
  }

  getAllSpatialReferenceSystems(): SpatialReferenceSystem[] {
    const spatialRefSystems: SpatialReferenceSystem[] = [];
    if (this.db != null && this.isTableExists()) {
      const results: Record<string, DBValue>[] = this.queryForAll();
      if (results && results.length) {
        for (let i = 0; i < results.length; i++) {
          spatialRefSystems.push(this.createObject(results[i]));
        }
      }
    }
    return spatialRefSystems;
  }

  getByOrganizationAndCoordSysId(organization: string, organizationCoordSysId: number): SpatialReferenceSystem {
    const cv = new FieldValues();
    cv.addFieldValue('organization', organization);
    cv.addFieldValue('organization_coordsys_id', organizationCoordSysId);
    const results: Record<string, DBValue>[] = this.queryForAll(this.buildWhere(cv), this.buildWhereArgs(cv));
    if (results && results.length) {
      return this.createObject(results[0]);
    }
  }
  /**
   * Get the Spatial Reference System for the provided id
   * @param  {Number}   srsId srs id
   * @return {SpatialReferenceSystem}
   */
  getBySrsId(srsId: number): SpatialReferenceSystem {
    return this.queryForId(srsId);
  }
  /**
   * Return the proj4 projection specified by this SpatialReferenceSystem
   * @return {typeof proj4}
   */
  getProjection(srs: SpatialReferenceSystem): Projection {
    return srs.projection;
  }

  /**
   * Get the Contents for the SpatialReferenceSystem
   * @param  {SpatialReferenceSystem} spatialReferenceSystem SpatialReferenceSystem
   * @return {GeometryColumns}
   */
  private getContents(spatialReferenceSystem: SpatialReferenceSystem): Contents[] {
    const contentsDao = this.geoPackage.getContentsDao();
    const results = contentsDao.queryForAllEq(Contents.COLUMN_SRS_ID, spatialReferenceSystem.getSrsId());
    const contents = [];
    if (results?.length) {
      for (let i = 0; i < results.length; i++) {
        contents.push(contentsDao.createObject(results[i]));
      }
    }
    return contents;
  }

  /**
   * Get the GeometryColumns for the SpatialReferenceSystem
   * @param  {SpatialReferenceSystem} spatialReferenceSystem SpatialReferenceSystem   
   * @return {GeometryColumns}
   */
  private getGeometryColumns(spatialReferenceSystem: SpatialReferenceSystem): GeometryColumns[] {
    const geometryColumnsDao = this.geoPackage.getGeometryColumnsDao();
    const results = geometryColumnsDao.queryForAllEq(GeometryColumns.COLUMN_SRS_ID, spatialReferenceSystem.getSrsId());
    const geometryColumns = [];
    if (results?.length) {
      for (let i = 0; i < results.length; i++) {
        geometryColumns.push(geometryColumnsDao.createObject(results[i]));
      }
    }
    return geometryColumns;
  }

  /**
   * Get the TileMatrixSet for the SpatialReferenceSystem
   * @param  {SpatialReferenceSystem} spatialReferenceSystem SpatialReferenceSystem  
   * @return {TileMatrixSet}
   */
  private getTileMatrixSet(spatialReferenceSystem: SpatialReferenceSystem): TileMatrixSet[] {
    const tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
    const results = tileMatrixSetDao.queryForAllEq(TileMatrixSet.COLUMN_SRS_ID, spatialReferenceSystem.getSrsId());
    const tileMatrixSet = [];
    if (results?.length) {
      for (let i = 0; i < results.length; i++) {
        tileMatrixSet.push(tileMatrixSetDao.createObject(results[i]));
      }
    }
    return tileMatrixSet;
  }

  /**
   * Delete the Spatial Reference System, cascading
   * @param srs spatial reference system
   * @return deleted count
   */
  public deleteCascade(srs: SpatialReferenceSystem): number {
    let count = 0;

    if (srs != null) {
      // Delete Contents
      const contentsCollection = this.getContents(srs);
      if (contentsCollection.length !== 0) {
        for (const contents of contentsCollection) {
          this.geoPackage.getContentsDao().deleteCascade(contents);
        }
      }

      // Delete Geometry Columns
      const geometryColumnsDao = this.geoPackage.getGeometryColumnsDao();
      if (geometryColumnsDao.isTableExists()) {
        const geometryColumnsCollection = this.getGeometryColumns(srs);
        if (geometryColumnsCollection.length !== 0) {
          for (const geometryColumns of geometryColumnsCollection) {
            geometryColumnsDao.delete(geometryColumns);
          }
        }
      }

      // Delete Tile Matrix Set
      const tileMatrixSetDao = this.geoPackage.getTileMatrixSetDao();
      if (tileMatrixSetDao.isTableExists()) {
        const tileMatrixSetCollection = this.getTileMatrixSet(srs);
        if (tileMatrixSetCollection.length !== 0) {
          for (const tileMatrixSet of tileMatrixSetCollection) {
            tileMatrixSetDao.delete(tileMatrixSet);
          }
        }
      }

      // Delete
      count = this.delete(srs);
    }
    return count;
  }

  /**
   * Create the srs if needed
   * @param srs srs if exists or null
   * @param organization organization
   * @param id coordinate id
   * @return srs
   */
  private createIfNeeded(srs: SpatialReferenceSystem, organization: string, id: number): SpatialReferenceSystem {
    if (srs == null) {
      if (organization.toLowerCase() === ProjectionConstants.AUTHORITY_EPSG.toLowerCase()) {
        switch (id) {
          case ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM:
            srs = this.createWgs84();
            break;
          case ProjectionConstants.EPSG_WEB_MERCATOR:
            srs = this.createWebMercator();
            break;
          case ProjectionConstants.EPSG_WORLD_GEODETIC_SYSTEM_GEOGRAPHICAL_3D:
            srs = this.createWgs84Geographical3D();
            break;
          default:
            throw new GeoPackageException(
              'Spatial Reference System not supported for metadata creation. Organization: ' +
                organization +
                ', id: ' +
                id,
            );
        }
      } else if (organization.toLowerCase() === ProjectionConstants.AUTHORITY_NONE.toLowerCase()) {
        switch (id) {
          case ProjectionConstants.UNDEFINED_CARTESIAN:
            srs = this.createUndefinedCartesian();
            break;
          case ProjectionConstants.UNDEFINED_GEOGRAPHIC:
            srs = this.createUndefinedGeographic();
            break;
          default:
            throw new GeoPackageException(
              'Spatial Reference System not supported for metadata creation. Organization: ' +
                organization +
                ', id: ' +
                id,
            );
        }
      } else {
        throw new GeoPackageException(
          'Spatial Reference System not supported for metadata creation. Organization: ' + organization + ', id: ' + id,
        );
      }
    }
    return srs;
  }

  /**
   * Query for the organization coordsys id
   * @param organization organization
   * @param organizationCoordsysId organization coordsys id
   * @return srs
   */
  public queryForOrganizationCoordsysId(organization: string, organizationCoordsysId: number): SpatialReferenceSystem {
    let srs = null;
    const columnValues = new FieldValues();
    columnValues.addFieldValue(SpatialReferenceSystemConstants.COLUMN_ORGANIZATION, organization);
    columnValues.addFieldValue(SpatialReferenceSystemConstants.COLUMN_ORGANIZATION_COORDSYS_ID, organizationCoordsysId);
    const results = [];
    for (const result of this.queryForFieldValues(columnValues)) {
      results.push(this.createObject(result));
    }
    if (results.length !== 0) {
      if (results.length > 1) {
        throw new GeoPackageException(
          'More than one SpatialReferenceSystem' +
            ' returned for Organization: ' +
            organization +
            ', Organization Coordsys Id: ' +
            organizationCoordsysId,
        );
      }
      srs = results[0];
    }
    return srs;
  }

  /**
   * Get or Create the Spatial Reference System for the provided epsg
   * @param epsg epsg
   * @return srs
   */
  public getOrCreateFromEpsg(epsg: number): SpatialReferenceSystem {
    return this.getOrCreateCode(ProjectionConstants.AUTHORITY_EPSG, epsg);
  }

  /**
   * Get or Create the Spatial Reference System for the provided organization
   * and id
   *
   * @param organization organization
   * @param coordsysId coordsys id
   * @return srs
   */
  public getOrCreateCode(organization: string, coordsysId: number): SpatialReferenceSystem {
    let srs = this.queryForOrganizationCoordsysId(organization, coordsysId);
    srs = this.createIfNeeded(srs, organization, coordsysId);
    return srs;
  }

  /**
   * Get or Create the Spatial Reference System from the projection
   * @param projection projection
   * @return srs
   */
  public getOrCreate(projection: Projection): SpatialReferenceSystem {
    return this.getOrCreateCode(projection.getAuthority(), Number.parseInt(projection.getCode()));
  }
}
