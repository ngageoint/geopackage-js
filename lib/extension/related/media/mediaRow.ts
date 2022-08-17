/**
 * MediaRow module.
 * @module extension/relatedTables
 */
import { MediaTable } from './mediaTable';
import { ImageUtils } from '../../../tiles/imageUtils';
import { UserCustomRow } from '../../../user/custom/userCustomRow';
import { UserCustomColumn } from '../../../user/custom/userCustomColumn';

/**
 * User Media Row containing the values from a single result set row
 */
export class MediaRow extends UserCustomRow {
  /**
   * Constructor to create an empty row
   * @param table media table
   */
  public constructor(table: MediaTable);

  /**
   * Constructor
   * @param userCustomRow user custom row
   */
  public constructor(userCustomRow: UserCustomRow);

  /**
   * Copy Constructor
   * @param mediaRow media row to copy
   */
  public constructor(mediaRow: MediaRow);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof MediaTable) {
        super(args[0]);
      } else if (args[0] instanceof UserCustomRow) {
        const userCustomRow = args[0];
        super(
          userCustomRow.getTable(),
          userCustomRow.getColumns(),
          userCustomRow.getRowColumnTypes(),
          userCustomRow.getValues(),
        );
      } else if (args[0] instanceof MediaRow) {
        super(args[0]);
      }
    }
  }

  /**
   * {@inheritDoc}
   */
  public getTable(): MediaTable {
    return super.getTable() as MediaTable;
  }

  /**
   * Get the id column index
   *
   * @return id column index
   */
  public getIdColumnIndex(): number {
    return this.getColumns().getPkColumnIndex();
  }

  /**
   * Get the id column
   *
   * @return id column
   */
  public getIdColumn(): UserCustomColumn {
    return this.getColumns().getPkColumn();
  }

  /**
   * Get the id
   * @return id
   */
  public getId(): number {
    return this.getValueWithIndex(this.getIdColumnIndex()) as number;
  }

  /**
   * Get the data column index
   *
   * @return data column index
   */
  public getDataColumnIndex(): number {
    return this.getColumns().getColumnIndexForColumnName(MediaTable.COLUMN_DATA);
  }

  /**
   * Get the data column
   *
   * @return data column
   */
  public getDataColumn(): UserCustomColumn {
    return this.getColumns().getColumn(MediaTable.COLUMN_DATA);
  }

  /**
   * Get the data
   *
   * @return data
   */
  public getData(): Buffer {
    return this.getValueWithIndex(this.getDataColumnIndex()) as Buffer;
  }

  /**
   * Set the data
   *
   * @param data
   *            data
   */
  public setData(data: Buffer): void {
    this.setValueWithIndex(this.getDataColumnIndex(), data);
  }

  /**
   * Get the data image
   * @return image
   */
  public async getDataImage(): Promise<{ image: any; width: number; height: number }> {
    return ImageUtils.getImage(this.getData(), this.getContentType());
  }

  /**
   * Get the scaled data image
   * @param {number} scale
   * @return {Promise<Image>}
   */
  getScaledDataImage(scale: number): Promise<{ image: any; width: number; height: number }> {
    return ImageUtils.getScaledImage(this.getData(), scale);
  }

  /**
   * Get the content type column index
   *
   * @return content type column index
   */
  public getContentTypeColumnIndex(): number {
    return this.getColumns().getColumnIndexForColumnName(MediaTable.COLUMN_CONTENT_TYPE);
  }

  /**
   * Get the content type column
   *
   * @return content type column
   */
  public getContentTypeColumn(): UserCustomColumn {
    return this.getColumns().getColumn(MediaTable.COLUMN_CONTENT_TYPE);
  }

  /**
   * Get the content type
   *
   * @return content type
   */
  public getContentType(): string {
    return this.getValueWithIndex(this.getContentTypeColumnIndex());
  }

  /**
   * Set the content type
   * @param contentType content type
   */
  public setContentType(contentType: string): void {
    this.setValueWithIndex(this.getContentTypeColumnIndex(), contentType);
  }

  /**
   * Copy the row
   *
   * @return row copy
   */
  public copy(): MediaRow {
    return new MediaRow(this);
  }
}
