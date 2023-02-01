import { TileTable } from './tileTable';
import { UserRow } from '../../user/userRow';
import { TileColumn } from './tileColumn';
import { TileColumns } from './tileColumns';
import { ImageUtils } from '../../image/imageUtils';
import { GeoPackageImage } from '../../image/geoPackageImage';
import { ImageType } from '../../image/imageType';

/**
 * Tile Row containing the values from a single result set row
 */
export class TileRow extends UserRow<TileColumn, TileTable> {
  /**
   * Constructor
   * @param table tile table
   * @param columns columns
   * @param columnTypes column types
   * @param values values
   */
  public constructor(table: TileTable, columns: TileColumns, columnTypes: number[], values: any[]);

  /**
   * Constructor to create an empty row
   * @param table
   */
  public constructor(table: TileTable);

  /**
   * Copy Constructor
   * @param tileRow tile row to copy
   */
  public constructor(tileRow: TileRow);

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
   * @inheritDoc
   */
  public getColumns(): TileColumns {
    return super.getColumns() as TileColumns;
  }

  /**
   * Get the zoom level column index
   * @return zoom level column index
   */
  public getZoomLevelColumnIndex(): number {
    return this.getColumns().getZoomLevelIndex();
  }

  /**
   * Get the zoom level column
   * @return zoom level column
   */
  public getZoomLevelColumn(): TileColumn {
    return this.getColumns().getZoomLevelColumn();
  }

  /**
   * Get the zoom level
   * @return zoom level
   */
  public getZoomLevel(): number {
    return this.getValueWithIndex(this.getZoomLevelColumnIndex()) as number;
  }

  /**
   * Set the zoom level
   * @param zoomLevel zoom level
   */
  public setZoomLevel(zoomLevel: number): void {
    this.setValueWithIndex(this.getZoomLevelColumnIndex(), zoomLevel);
  }

  /**
   * Get the tile column column index
   * @return tile column index
   */
  public getTileColumnColumnIndex(): number {
    return this.getColumns().getTileColumnIndex();
  }

  /**
   * Get the tile column column
   *
   * @return tile column
   */
  public getTileColumnColumn(): TileColumn {
    return this.getColumns().getTileColumnColumn();
  }

  /**
   * Get the tile column
   *
   * @return tile column
   */
  public getTileColumn(): number {
    return this.getValueWithIndex(this.getTileColumnColumnIndex()) as number;
  }

  /**
   * Set the tile column
   *
   * @param tileColumn
   *            tile column
   */
  public setTileColumn(tileColumn: number): void {
    this.setValueWithIndex(this.getTileColumnColumnIndex(), tileColumn);
  }

  /**
   * Get the tile row column index
   *
   * @return tile row column index
   */
  public getTileRowColumnIndex(): number {
    return this.getColumns().getTileRowIndex();
  }

  /**
   * Get the tile row column
   *
   * @return tile row column
   */
  public getTileRowColumn(): TileColumn {
    return this.getColumns().getTileRowColumn();
  }

  /**
   * Get the tile row
   *
   * @return tile row
   */
  public getTileRow(): number {
    return this.getValueWithIndex(this.getTileRowColumnIndex()) as number;
  }

  /**
   * Set the tile row
   *
   * @param tileRow
   *            tile row
   */
  public setTileRow(tileRow: number): void {
    this.setValueWithIndex(this.getTileRowColumnIndex(), tileRow);
  }

  /**
   * Get the tile data column index
   *
   * @return tile data column index
   */
  public getTileDataColumnIndex(): number {
    return this.getColumns().getTileDataIndex();
  }

  /**
   * Get the tile data column
   *
   * @return tile data column
   */
  public getTileDataColumn(): TileColumn {
    return this.getColumns().getTileDataColumn();
  }

  /**
   * Get the tile data
   *
   * @return bytes
   */
  public getTileData(): Buffer | Uint8Array {
    return this.getValueWithIndex(this.getTileDataColumnIndex());
  }

  /**
   * Set the tile data
   *
   * @param tileData
   *            tile data
   */
  public setTileData(tileData: Buffer | Uint8Array): void {
    this.setValueWithIndex(this.getTileDataColumnIndex(), tileData);
  }

  /**
   * Get the tile data image
   * @return image
   */
  public getTileDataImage(): Promise<GeoPackageImage> {
    return ImageUtils.getImage(this.getTileData());
  }

  /**
   * Set the tile data from a GeoPackageImage
   * @param image image
   * @param imageFormat image format
   * @param compressionQuality compression quality
   */
  public async setTileDataWithGeoPackageImage(
    image: GeoPackageImage,
    imageFormat: ImageType,
    compressionQuality?: number,
  ): Promise<void> {
    const buffer = await ImageUtils.writeImageToBytes(image, imageFormat, compressionQuality);
    this.setTileData(buffer);
  }

  /**
   * Copy the row
   * @return row copy
   */
  public copy(): TileRow {
    return new TileRow(this);
  }
}
