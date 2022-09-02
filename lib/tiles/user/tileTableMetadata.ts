import { TileColumn } from './tileColumn';
import { UserTableMetadata } from '../../user/userTableMetadata';
import { ContentsDataType } from '../../contents/contentsDataType';
import { BoundingBox } from '../../boundingBox';
import { TileTable } from './tileTable';

/**
 * Tile Table Metadata for defining table creation information
 */
export class TileTableMetadata extends UserTableMetadata<TileColumn> {
  /**
   * Default data type
   */
  public static readonly DEFAULT_DATA_TYPE = ContentsDataType.nameFromType(ContentsDataType.TILES);

  /**
   * Create metadata
   *
   * @param tableName table name
   * @param contentsBoundingBox contents bounding box
   * @param contentsSrsId contents SRS id
   * @param tileBoundingBox tile bounding box
   * @param tileSrsId tile SRS id
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static create(
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileBoundingBox: BoundingBox,
    tileSrsId: number,
    autoincrement?: boolean,
  ): TileTableMetadata {
    return new TileTableMetadata(
      undefined,
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileBoundingBox,
      tileSrsId,
      autoincrement,
    );
  }

  /**
   * Create metadata
   * @param dataType data type
   * @param tableName table name
   * @param contentsBoundingBox contents bounding box
   * @param contentsSrsId contents SRS id
   * @param tileBoundingBox tile bounding box
   * @param tileSrsId tile SRS id
   * @param autoincrement autoincrement ids
   * @return metadata
   */
  public static createTyped(
    dataType: string,
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileBoundingBox: BoundingBox,
    tileSrsId: number,
    autoincrement: boolean,
  ): TileTableMetadata {
    return new TileTableMetadata(
      dataType,
      tableName,
      contentsBoundingBox,
      contentsSrsId,
      tileBoundingBox,
      tileSrsId,
      autoincrement,
    );
  }

  /**
   * Contents bounding box
   */
  private contentsBoundingBox: BoundingBox;

  /**
   * Contents SRS id
   */
  private contentsSrsId: number;

  /**
   * Tile bounding box
   */
  private tileBoundingBox: BoundingBox;

  /**
   * Tile SRS id
   */
  private tileSrsId = -1;

  /**
   * Constructor
   * @param dataType data type
   * @param tableName table name
   * @param autoincrement autoincrement ids
   * @param contentsBoundingBox contents bounding box
   * @param contentsSrsId contents SRS id
   * @param tileBoundingBox tile bounding box
   * @param tileSrsId tile SRS id
   */
  public constructor(
    dataType: string,
    tableName: string,
    contentsBoundingBox: BoundingBox,
    contentsSrsId: number,
    tileBoundingBox: BoundingBox,
    tileSrsId: number,
    autoincrement = false,
  ) {
    super();
    this.dataType = dataType;
    this.tableName = tableName;
    this.contentsBoundingBox = contentsBoundingBox;
    this.contentsSrsId = contentsSrsId;
    this.tileBoundingBox = tileBoundingBox;
    this.tileSrsId = tileSrsId;
    this.autoincrement = autoincrement;
  }

  /**
   * {@inheritDoc}
   */
  public getDefaultDataType(): string {
    return TileTableMetadata.DEFAULT_DATA_TYPE;
  }

  /**
   * {@inheritDoc}
   */
  public buildColumns(): TileColumn[] {
    let tileColumns = this.getColumns();

    if (tileColumns == null) {
      tileColumns = TileTable.createRequiredColumns(this.isAutoincrement());
    }

    return tileColumns;
  }

  /**
   * Get the contents bounding box
   *
   * @return contents bounding box
   */
  public getContentsBoundingBox(): BoundingBox {
    return this.contentsBoundingBox != null ? this.contentsBoundingBox : this.getTileBoundingBox();
  }

  /**
   * Set the contents bounding box
   *
   * @param contentsBoundingBox contents bounding box
   */
  public setContentsBoundingBox(contentsBoundingBox: BoundingBox): void {
    this.contentsBoundingBox = contentsBoundingBox;
  }

  /**
   * Get the contents SRS id
   *
   * @return contents SRS id
   */
  public getContentsSrsId(): number {
    return this.contentsSrsId != null ? this.contentsSrsId : this.getTileSrsId();
  }

  /**
   * Set the contents SRS id
   *
   * @param contentsSrsId SRS id
   */
  public setContentsSrsId(contentsSrsId: number): void {
    this.contentsSrsId = contentsSrsId;
  }

  /**
   * Get the tile bounding box
   *
   * @return tile bounding box
   */
  public getTileBoundingBox(): BoundingBox {
    return this.tileBoundingBox;
  }

  /**
   * Set the tile bounding box
   *
   * @param tileBoundingBox tile bounding box
   */
  public setTileBoundingBox(tileBoundingBox: BoundingBox): void {
    this.tileBoundingBox = tileBoundingBox;
  }

  /**
   * Get the tile SRS id
   *
   * @return tile SRS id
   */
  public getTileSrsId(): number {
    return this.tileSrsId;
  }

  /**
   * Set the tile SRS id
   *
   * @param tileSrsId SRS id
   */
  public setTileSrsId(tileSrsId: number): void {
    this.tileSrsId = tileSrsId;
  }
}
