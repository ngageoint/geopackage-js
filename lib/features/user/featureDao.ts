import { FeatureTableIndex } from '../../extension/nga/index/featureTableIndex';
import { UserDao } from '../../user/userDao';
import { FeatureRow } from './featureRow';
import { BoundingBox } from '../../boundingBox';
import { GeometryColumns } from '../columns/geometryColumns';
import { FeatureTable } from './featureTable';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { Projection } from '@ngageoint/projections-js';
import { FeatureColumn } from './featureColumn';
import { FeatureResultSet } from './featureResultSet';
import { FeatureConnection } from './featureConnection';
import { GeoPackageException } from '../../geoPackageException';
import { GeometryType } from '@ngageoint/simple-features-js';
import type { GeoPackage } from '../../geoPackage';

/**
 * Feature DAO for reading feature user data tables
 */
export class FeatureDao extends UserDao<FeatureColumn, FeatureTable, FeatureRow, FeatureResultSet> {
  featureTableIndex: FeatureTableIndex;
  projection: Projection;

  /**
   * Feature connection
   */
  private readonly featureDb: FeatureConnection;

  /**
   * Geometry Columns
   */
  private readonly geometryColumns: GeometryColumns;

  /**
   * Constructor
   * @param database database name
   * @param geoPackage GeoPackage
   * @param geometryColumns geometry columns
   * @param table feature table
   */
  public constructor(
    database: string,
    geoPackage: GeoPackage,
    geometryColumns: GeometryColumns,
    table: FeatureTable,
  ) {
    super(database, geoPackage, new FeatureConnection(geoPackage.getConnection()), table);
    this.featureDb = this.getUserDb() as FeatureConnection;
    this.geometryColumns = geometryColumns;
    const contents = this.geoPackage.getContentsDao().getContentsWithGeometryColumns(geometryColumns);
    if (contents == null) {
      throw new GeoPackageException('GeometryColumns ' + geometryColumns.getId() + ' has null Contents');
    }
    const srs = this.geoPackage.getSpatialReferenceSystemDao().getBySrsId(geometryColumns.getSrsId());
    if (srs == null) {
      throw new GeoPackageException('GeometryColumns ' + geometryColumns.getId() + ' has null SpatialReferenceSystem');
    }
    this.projection = srs.getProjection();
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBox(): BoundingBox {
    return this.getBoundingBoxWithProjection(this.projection);
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBoxWithProjection(projection: Projection): BoundingBox {
    const contents = this.geoPackage.getContentsDao().getContentsWithGeometryColumns(this.geometryColumns);
    return this.geoPackage.getContentsDao().getBoundingBoxWithContentsAndProjection(contents, projection);
  }

  /**
   * {@inheritDoc}
   */
  public newRow(): FeatureRow {
    return new FeatureRow(this.getTable());
  }

  /**
   * Get the Feature connection
   *
   * @return feature connection
   */
  public getFeatureDb(): FeatureConnection {
    return this.featureDb;
  }

  /**
   * Get the Geometry Columns
   *
   * @return geometry columns
   */
  public getGeometryColumns(): GeometryColumns {
    return this.geometryColumns;
  }

  /**
   * Get the Geometry Column name
   *
   * @return geometry column name
   */
  public getGeometryColumnName(): string {
    return this.geometryColumns.getColumnName();
  }

  /**
   * Get the Geometry Type
   *
   * @return geometry type
   */
  public getGeometryType(): GeometryType {
    return this.geometryColumns.getGeometryType();
  }

  /**
   * Get the Spatial Reference System
   *
   * @return srs
   */
  public getSrs(): SpatialReferenceSystem {
    return this.geoPackage.getSpatialReferenceSystemDao().getBySrsId(this.geometryColumns.getSrsId());
  }

  /**
   * Get the Spatial Reference System id
   *
   * @return srs id
   */
  public getSrsId(): number {
    return this.geometryColumns.getSrsId();
  }

  /**
   * Get the Id Column
   *
   * @return id column
   */
  public getIdColumn(): FeatureColumn {
    return this.getPkColumn();
  }

  /**
   * Get the Id Column name
   *
   * @return id column name
   */
  public getIdColumnName(): string {
    return this.getPkColumnName();
  }

  /**
   * Get the Id and Geometry Column names
   *
   * @return column names
   */
  public getIdAndGeometryColumnNames(): string[] {
    return this.getTable().getIdAndGeometryColumnNames();
  }
}
