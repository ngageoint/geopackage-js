import { FeatureTable } from './featureTable';
import { UserRow } from '../../user/userRow';
import { FeatureColumn } from './featureColumn';
import { GeoPackageGeometryData } from '../../geom/geoPackageGeometryData';
import { Geometry, GeometryEnvelope, GeometryType } from '@ngageoint/simple-features-js';
import { FeatureColumns } from './featureColumns';
import { GeoPackageException } from '../../geoPackageException';
import { ContentValues } from '../../user/contentValues';

/**
 * Feature Row containing the values from a single result set row
 */
export class FeatureRow extends UserRow<FeatureColumn, FeatureTable> {
  /**
   * Constructor
   * @param table feature table
   * @param columns columns
   * @param columnTypes column types
   * @param values values
   */
  constructor(table: FeatureTable, columns: FeatureColumns, columnTypes: number[], values: any[]);

  /**
   * Constructor to create an empty row
   * @param table
   */
  public constructor(table: FeatureTable);

  /**
   * Copy Constructor
   * @param featureRow feature row to copy
   */
  public constructor(featureRow: FeatureRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      super(args[0]);
    } else if (args.length === 4) {
      super(args[0], args[1], args[2], args[3]);
    }
  }

  /**
   * {@inheritDoc}
   */
  public getColumns(): FeatureColumns {
    return super.getColumns() as FeatureColumns;
  }

  /**
   * Handles geometry columns
   */
  public setValueWithIndex(index: number, value: any): void {
    if (index == this.getGeometryColumnIndex() && (value instanceof Buffer || value instanceof Uint8Array)) {
      const buffer = Buffer.from(value);
      value = GeoPackageGeometryData.createWithBuffer(buffer);
    }
    super.setValueWithIndex(index, value);
  }

  /**
   * Handles geometry columns
   */
  public setValue(columnName: string, value: any): void {
    if (
      columnName.toLowerCase() === this.getGeometryColumnName().toLowerCase() &&
      (value instanceof Buffer || value instanceof Uint8Array)
    ) {
      const buffer = Buffer.from(value);
      value = GeoPackageGeometryData.createWithBuffer(buffer);
    }
    super.setValue(columnName, value);
  }

  /**
   * {@inheritDoc}
   * <p>
   * Handles geometry columns
   */
  protected copyValue(column: FeatureColumn, value: any): any {
    let copyValue = null;

    if (column.isGeometry() && value instanceof GeoPackageGeometryData) {
      const geometryData = value as GeoPackageGeometryData;
      try {
        const buffer = geometryData.toBuffer();
        copyValue = GeoPackageGeometryData.createWithBuffer(Buffer.from(buffer));
      } catch (e) {
        throw new GeoPackageException('Failed to copy Geometry Data bytes. column: ' + column.getName());
      }
    } else {
      copyValue = super.copyValue(column, value);
    }

    return copyValue;
  }

  /**
   * {@inheritDoc}
   * <p>
   * Handles geometry columns
   */
  protected columnToContentValue(contentValues: ContentValues, column: FeatureColumn, value: any): void {
    if (column.isGeometry()) {
      const columnName = column.getName();

      if (value instanceof GeoPackageGeometryData) {
        const geometryData = value as GeoPackageGeometryData;
        try {
          contentValues.put(columnName, geometryData.toBuffer());
        } catch (e) {
          throw new GeoPackageException('Failed to write Geometry Data bytes. column: ' + columnName);
        }
      } else if (value instanceof Buffer || value instanceof Uint8Array) {
        contentValues.put(columnName, value);
      } else {
        throw new GeoPackageException(
          'Unsupported update geometry column value type. column: ' + columnName + ', value type: ' + typeof value,
        );
      }
    } else {
      super.columnToContentValue(contentValues, column, value);
    }
  }

  /**
   * Get the geometry column index
   * @return geometry column index
   */
  public getGeometryColumnIndex(): number {
    return this.getColumns().getGeometryIndex();
  }

  /**
   * Get the geometry feature column
   * @return geometry feature column
   */
  public getGeometryColumn(): FeatureColumn {
    return this.getColumns().getGeometryColumn();
  }

  /**
   * Get the geometry column name
   * @return geometry column name
   */
  public getGeometryColumnName(): string {
    return this.getColumns().getGeometryColumnName();
  }

  /**
   * Get the geometry
   * @return geometry data
   */
  public getGeometry(): GeoPackageGeometryData {
    let geometryData: GeoPackageGeometryData = null;
    const value = this.getValueWithIndex(this.getGeometryColumnIndex());
    if (value != null) {
      geometryData = value as GeoPackageGeometryData;
    }
    return geometryData;
  }

  /**
   * Set the geometry data
   * @param geometryData geometry data
   */
  public setGeometry(geometryData: GeoPackageGeometryData): void {
    this.setValueWithIndex(this.getGeometryColumnIndex(), geometryData);
  }

  /**
   * Get the simple features geometry value
   * @return geometry
   */
  public getGeometryValue(): Geometry {
    const data = this.getGeometry();
    let geometry = null;
    if (data != null) {
      geometry = data.getGeometry();
    }
    return geometry;
  }

  /**
   * Get the simple features geometry type
   * @return geometry type
   */
  public getGeometryType(): GeometryType {
    const geometry = this.getGeometryValue();
    let geometryType = null;
    if (geometry != null) {
      geometryType = geometry.geometryType;
    }
    return geometryType;
  }

  /**
   * Get the geometry envelope
   * @return geometry envelope
   */
  public getGeometryEnvelope(): GeometryEnvelope {
    const data = this.getGeometry();
    let envelope = null;
    if (data != null) {
      envelope = data.getOrBuildEnvelope();
    }
    return envelope;
  }

  /**
   * Copy the row
   * @return row copy
   */
  public copy(): FeatureRow {
    return new FeatureRow(this);
  }
}
