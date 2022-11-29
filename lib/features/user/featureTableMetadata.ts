import { UserTableMetadata } from '../../user/userTableMetadata';
import { FeatureColumn } from './featureColumn';
import { ContentsDataType } from '../../contents/contentsDataType';
import { GeometryType } from '@ngageoint/simple-features-js';
import { BoundingBox } from '../../boundingBox';
import { GeometryColumns } from '../columns/geometryColumns';
import { FeatureTable } from './featureTable';

/**
 * Feature Table Metadata for defining table creation information
 */
export class FeatureTableMetadata extends UserTableMetadata<FeatureColumn> {
  /**
   * Default data type
   */
  public static readonly DEFAULT_DATA_TYPE = ContentsDataType.nameFromType(ContentsDataType.FEATURES);

  /**
   * Default geometry column name
   */
  public static readonly DEFAULT_COLUMN_NAME = 'geometry';

  /**
   * Default geometry type
   */
  public static readonly DEFAULT_GEOMETRY_TYPE = GeometryType.GEOMETRY;

  /**
   * Create metadata
   * @param geometryColumns
   * @param boundingBox
   * @param additionalColumns
   * @param idColumnName
   * @param autoincrement
   */
  public static create(
    geometryColumns: GeometryColumns,
    additionalColumns?: FeatureColumn[],
    idColumnName?: string,
    boundingBox?: BoundingBox,
    autoincrement?: boolean,
  ): FeatureTableMetadata {
    return new FeatureTableMetadata(null, geometryColumns, idColumnName, additionalColumns, boundingBox, autoincrement);
  }

  /**
   * Create metadata with Table
   * @param geometryColumns
   * @param table
   * @param idColumnName
   * @param boundingBox
   * @param autoincrement
   */
  public static createWithTable(
    geometryColumns: GeometryColumns,
    table: FeatureTable,
    idColumnName?: string,
    boundingBox?: BoundingBox,
    autoincrement?: boolean,
  ): FeatureTableMetadata {
    return new FeatureTableMetadata(
      null,
      geometryColumns,
      idColumnName,
      table.getColumns(),
      boundingBox,
      autoincrement,
    );
  }

  /**
   * Create metadata
   * @param dataType
   * @param geometryColumns
   * @param boundingBox
   * @param additionalColumns
   * @param idColumnName
   * @param autoincrement
   */
  public static createTyped(
    dataType: string,
    geometryColumns: GeometryColumns,
    boundingBox?: BoundingBox,
    additionalColumns?: FeatureColumn[],
    idColumnName?: string,
    autoincrement?: boolean,
  ): FeatureTableMetadata {
    return new FeatureTableMetadata(
      dataType,
      geometryColumns,
      idColumnName,
      additionalColumns,
      boundingBox,
      autoincrement,
    );
  }

  /**
   * Create metadata
   * @param dataType
   * @param geometryColumns
   * @param table
   * @param idColumnName
   * @param boundingBox
   * @param autoincrement
   */
  public static createTypedWithTable(
    dataType: string,
    geometryColumns: GeometryColumns,
    table: FeatureTable,
    idColumnName?: string,
    boundingBox?: BoundingBox,
    autoincrement = false,
  ): FeatureTableMetadata {
    return new FeatureTableMetadata(
      dataType,
      geometryColumns,
      idColumnName,
      table.getColumns(),
      boundingBox,
      autoincrement,
    );
  }

  /**
   * Bounding box
   */
  protected boundingBox: BoundingBox;

  /**
   * Geometry columns
   */
  protected geometryColumns: GeometryColumns;

  /**
   * Constructor
   */
  public constructor();

  /**
   * Constructor
   *
   * @param dataType data type
   * @param geometryColumns table name
   * @param idColumnName id column name
   * @param additionalColumns additional columns
   * @param boundingBox constraints
   * @param autoincrement autoincrement ids
   */
  public constructor(
    dataType: string,
    geometryColumns: GeometryColumns,
    idColumnName: string,
    additionalColumns: FeatureColumn[],
    boundingBox: BoundingBox,
    autoincrement: boolean,
  );

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    super();
    if (args.length === 6) {
      this.dataType = args[0];
      this.geometryColumns = args[1];
      this.idColumnName = args[2];
      this.additionalColumns = args[3];
      this.boundingBox = args[4];
      this.autoincrement = args[5];
    }
  }
  /**
   * {@inheritDoc}
   */
  public getDefaultDataType(): string {
    return FeatureTableMetadata.DEFAULT_DATA_TYPE;
  }

  /**
   * {@inheritDoc}
   */
  public buildColumns(): FeatureColumn[] {
    let featureColumns = this.getColumns();
    if (featureColumns == null) {
      featureColumns = [];
      featureColumns.push(FeatureColumn.createPrimaryKeyColumn(this.getIdColumnName(), this.isAutoincrement()));
      featureColumns.push(FeatureColumn.createGeometryColumn(this.getColumnName(), this.getGeometryType()));
      const additional = this.getAdditionalColumns();
      if (additional != null) {
        featureColumns.push(...additional);
      }
    }
    return featureColumns;
  }

  /**
   * {@inheritDoc}
   */
  public getTableName(): string {
    let tableName = null;
    if (this.geometryColumns != null) {
      tableName = this.geometryColumns.getTableName();
    }
    if (tableName == null) {
      tableName = super.getTableName();
      if (this.geometryColumns != null) {
        this.geometryColumns.setTableName(tableName);
      }
    }
    return tableName;
  }

  /**
   * Get the bounding box
   *
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  /**
   * Set the bounding box
   *
   * @param boundingBox
   *            bounding box
   */
  public setBoundingBox(boundingBox: BoundingBox): void {
    this.boundingBox = boundingBox;
  }

  /**
   * Get the geometry columns
   *
   * @return geometry columns
   */
  public getGeometryColumns(): GeometryColumns {
    return this.geometryColumns;
  }

  /**
   * Set the geometry columns
   * @param geometryColumns geometry columns
   */
  public setGeometryColumns(geometryColumns: GeometryColumns): void {
    this.geometryColumns = geometryColumns;
  }

  /**
   * Get the column name
   * @return column name
   */
  public getColumnName(): string {
    let columnName = null;
    if (this.geometryColumns != null) {
      columnName = this.geometryColumns.getColumnName();
    }
    if (columnName == null) {
      columnName = FeatureTableMetadata.DEFAULT_COLUMN_NAME;
      if (this.geometryColumns != null) {
        this.geometryColumns.setColumnName(columnName);
      }
    }
    return columnName;
  }

  /**
   * Get the geometry typ
   * @return geometry type
   */
  public getGeometryType(): GeometryType {
    let geometryType = null;
    if (this.geometryColumns != null) {
      geometryType = this.geometryColumns.getGeometryType();
    }
    if (geometryType == null) {
      geometryType = FeatureTableMetadata.DEFAULT_GEOMETRY_TYPE;
      if (this.geometryColumns != null) {
        this.geometryColumns.setGeometryType(geometryType);
      }
    }
    return geometryType;
  }
}
