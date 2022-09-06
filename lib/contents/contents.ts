/* eslint-disable @typescript-eslint/camelcase */
import { ContentsDataType } from './contentsDataType';
import { BoundingBox } from '../boundingBox';
import { DBValue } from '../db/dbValue';
import { SpatialReferenceSystemConstants } from '../srs/spatialReferenceSystemConstants';

/**
 * Contents object. Provides identifying and descriptive information that an
 * application can display to a user in a menu of geospatial data that is
 * available for access and/or update.
 */
export class Contents {
  /**
   * Table name
   */
  public static readonly TABLE_NAME: string = 'gpkg_contents';

  /**
   * table_name field name
   */
  public static readonly COLUMN_TABLE_NAME: string = 'table_name';

  /**
   * id field name, table_name
   */
  public static readonly COLUMN_ID: string = Contents.COLUMN_TABLE_NAME;

  /**
   * data_type field name
   */
  public static readonly COLUMN_DATA_TYPE: string = 'data_type';

  /**
   * identifier field name
   */
  public static readonly COLUMN_IDENTIFIER: string = 'identifier';

  /**
   * description field name
   */
  public static readonly COLUMN_DESCRIPTION: string = 'description';

  /**
   * last_change field name
   */
  public static readonly COLUMN_LAST_CHANGE: string = 'last_change';

  /**
   * min_x field name
   */
  public static readonly COLUMN_MIN_X: string = 'min_x';

  /**
   * min_y field name
   */
  public static readonly COLUMN_MIN_Y: string = 'min_y';

  /**
   * max_x field name
   */
  public static readonly COLUMN_MAX_X: string = 'max_x';

  /**
   * max_y field name
   */
  public static readonly COLUMN_MAX_Y: string = 'max_y';

  /**
   * srsId field name
   */
  public static readonly COLUMN_SRS_ID: string = SpatialReferenceSystemConstants.COLUMN_SRS_ID;

  /**
   * The name of the tiles, or feature table
   */
  private table_name: string;

  /**
   * Type of data stored in the table:. “features” per clause Features,
   * “tiles” per clause Tiles, or an implementer-defined value for other data
   * tables per clause in an Extended GeoPackage.
   */
  private data_type: string;

  /**
   * A human-readable identifier (e.g. short name) for the table_name content
   */
  private identifier: string;

  /**
   * A human-readable description for the table_name content
   */
  private description: string;

  /**
   * timestamp value in ISO 8601 format as defined by the strftime function
   * %Y-%m-%dT%H:%M:%fZ format string applied to the current time
   */
  private last_change: Date;

  /**
   * Bounding box minimum easting or longitude for all content in table_name
   */
  private min_x: number;

  /**
   * Bounding box minimum northing or latitude for all content in table_name
   */
  private min_y: number;

  /**
   * Bounding box maximum easting or longitude for all content in table_name
   */
  private max_x: number;

  /**
   * Bounding box maximum northing or latitude for all content in table_name
   */
  private max_y: number;

  /**
   * Unique identifier for each Spatial Reference System within a GeoPackage
   */
  private srs_id: number;

  public constructor();
  public constructor(contents: Contents);
  /**
   * Default Constructor
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof Contents) {
      this.table_name = args[0].table_name;
      this.data_type = args[0].data_type;
      this.identifier = args[0].identifier;
      this.description = args[0].description;
      this.last_change = new Date(args[0].last_change.getTime());
      this.min_x = args[0].min_x;
      this.max_x = args[0].max_x;
      this.min_y = args[0].min_y;
      this.max_y = args[0].max_y;
      this.srs_id = args[0].srs_id;
    }
  }

  /**
   * @param {string} columnName
   */
  toDatabaseValue(columnName: string): DBValue {
    if (columnName === Contents.COLUMN_LAST_CHANGE) {
      return this.last_change.toISOString();
    }
    return this[columnName];
  }

  /**
   * Get the id
   *
   * @return id
   */
  public getId(): string {
    return this.table_name;
  }

  /**
   * Set the id
   *
   * @param id
   *            id
   */
  public setId(id: string): void {
    this.table_name = id;
  }

  /**
   * Get the table name
   *
   * @return table name
   */
  public getTableName(): string {
    return this.table_name;
  }

  /**
   * Set the table name
   *
   * @param table_name
   *            table name
   */
  public setTableName(table_name: string): void {
    this.table_name = table_name;
  }

  /**
   * Get the data type
   *
   * @return data type
   */
  public getDataType(): ContentsDataType {
    return ContentsDataType.fromName(this.data_type);
  }

  /**
   * Set the data type
   *
   * @param data_type
   *            data type
   */
  public setDataType(data_type: ContentsDataType): void {
    this.data_type = ContentsDataType.nameFromType(data_type);
  }

  /**
   * Get the data type string value
   *
   * @return data type
   */
  public getDataTypeName(): string {
    return this.data_type;
  }

  /**
   * Set the data type name and register the core data type (if not provided, nothing is registered)
   *
   * @param name data type name
   * @param data_type core data type
   */
  public setDataTypeName(name: string, data_type: ContentsDataType = undefined): void {
    this.data_type = name;
    if (data_type != null) {
      ContentsDataType.setType(name, data_type);
    }
  }

  /**
   * Determine if the contents data type is features
   *
   * @return true if features type
   */
  public isFeaturesType(): boolean {
    return ContentsDataType.isFeaturesType(this.data_type);
  }

  /**
   * Determine if the contents data type is features or unknown
   *
   * @return true if features type or unknown
   */
  public isFeaturesTypeOrUnknown(): boolean {
    return ContentsDataType.isFeaturesType(this.data_type, true);
  }

  /**
   * Determine if the contents data type is tiles
   *
   * @return true if tiles type
   */
  public isTilesType(): boolean {
    return ContentsDataType.isTilesType(this.data_type);
  }

  /**
   * Determine if the contents data type is tiles or unknown
   *
   * @return true if tiles type or unknown
   */
  public isTilesTypeOrUnknown(): boolean {
    return ContentsDataType.isTilesType(this.data_type, true);
  }

  /**
   * Determine if the contents data type is attributes
   *
   * @return true if attributes type
   */
  public isAttributesType(): boolean {
    return ContentsDataType.isAttributesType(this.data_type);
  }

  /**
   * Determine if the contents data type is attributes or unknown
   *
   * @return true if attributes type or unknown
   */
  public isAttributesTypeOrUnknown(): boolean {
    return ContentsDataType.isAttributesType(this.data_type, true);
  }

  /**
   * Get the identifier
   *
   * @return identifier
   */
  public getIdentifier(): string {
    return this.identifier;
  }

  /**
   * Set the identifier
   *
   * @param identifier
   *            identifier
   */
  public setIdentifier(identifier: string): void {
    this.identifier = identifier;
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
   * @param description
   *            description
   */
  public setDescription(description: string): void {
    this.description = description;
  }

  /**
   * Get the last change
   *
   * @return last change
   */
  public getLastChange(): Date {
    return this.last_change;
  }

  /**
   * Set the last change
   *
   * @param last_change
   *            last change
   */
  public setLastChange(last_change: Date): void {
    this.last_change = last_change;
  }

  /**
   * Get the min x
   *
   * @return min x
   */
  public getMinX(): number {
    return this.min_x;
  }

  /**
   * Set the min x
   *
   * @param min_x
   *            min x
   */
  public setMinX(min_x: number): void {
    this.min_x = min_x;
  }

  /**
   * Get the min y
   *
   * @return min y
   */
  public getMinY(): number {
    return this.min_y;
  }

  /**
   * Set the min y
   *
   * @param min_y
   *            min y
   */
  public setMinY(min_y: number): void {
    this.min_y = min_y;
  }

  /**
   * Get the max x
   *
   * @return max x
   */
  public getMaxX(): number {
    return this.max_x;
  }

  /**
   * Set the max x
   *
   * @param max_x
   *            max x
   */
  public setMaxX(max_x: number): void {
    this.max_x = max_x;
  }

  /**
   * Get the max y
   *
   * @return max y
   */
  public getMaxY(): number {
    return this.max_y;
  }

  /**
   * Set the max y
   *
   * @param max_y
   *            max y
   */
  public setMaxY(max_y: number): void {
    this.max_y = max_y;
  }

  /**
   * Get the srs id
   * @return srs id
   */
  public getSrsId(): number {
    return this.srs_id;
  }

  /**
   * Set srs id
   * @param srsId
   */
  public setSrsId(srsId: number): void {
    this.srs_id = srsId;
  }

  /**
   * Get a bounding box
   *
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    let boundingBox = null;
    if (this.min_x != null && this.max_x != null && this.min_y != null && this.max_y != null) {
      boundingBox = new BoundingBox(this.getMinX(), this.getMinY(), this.getMaxX(), this.getMaxY());
    }
    return boundingBox;
  }

  /**
   * Set a bounding box
   * @param boundingBox bounding box
   */
  public setBoundingBox(boundingBox: BoundingBox): void {
    this.setMinX(boundingBox.getMinLongitude());
    this.setMaxX(boundingBox.getMaxLongitude());
    this.setMinY(boundingBox.getMinLatitude());
    this.setMaxY(boundingBox.getMaxLatitude());
  }

}
