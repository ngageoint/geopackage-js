/**
 * featureDao module.
 * @module features/user/featureDao
 */
import { FeatureTableIndex } from '../../extension/nga/index/featureTableIndex';
import { UserDao } from '../../user/userDao';
import { DataColumnsDao } from '../../extension/schema/columns/dataColumnsDao';
import { FeatureRow } from './featureRow';
import { BoundingBox } from '../../boundingBox';
import { GeometryColumns } from '../columns/geometryColumns';
import { FeatureTable } from './featureTable';
import { SpatialReferenceSystem } from '../../srs/spatialReferenceSystem';
import { Projection } from '@ngageoint/projections-js';
import { FeatureColumn } from './featureColumn';
import { FeatureResultSet } from './featureResultSet';
import { FeatureConnection } from './featureConnection';
import { GeoPackageConnection } from '../../db/geoPackageConnection';
import { GeoPackageException } from '../../geoPackageException';
import { GeometryType } from '@ngageoint/simple-features-js';

/**
 * Feature DAO for reading feature user data tables
 */
export class FeatureDao extends UserDao<FeatureColumn, FeatureTable, FeatureRow, FeatureResultSet> {
  dataColumnsDao: DataColumnsDao;
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
   * @param db GeoPackage connection
   * @param geometryColumns geometry columns
   * @param table feature table
   */
  public constructor(
    database: string,
    db: GeoPackageConnection,
    geometryColumns: GeometryColumns,
    table: FeatureTable,
  ) {
    super(database, db, new FeatureConnection(db), table);
    this.featureDb = this.getUserDb() as FeatureConnection;
    this.geometryColumns = geometryColumns;
    if (geometryColumns.getContents() == null) {
      throw new GeoPackageException('GeometryColumns ' + geometryColumns.getId() + ' has null Contents');
    }
    if (geometryColumns.getSrs() == null) {
      throw new GeoPackageException('GeometryColumns ' + geometryColumns.getId() + ' has null SpatialReferenceSystem');
    }
    this.projection = geometryColumns.getProjection();
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
    const contents = this.geometryColumns.getContents();
    const boundingBox = contents.getBoundingBoxWithProjection(projection);
    return boundingBox;
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
    return this.geometryColumns.getSrs();
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
