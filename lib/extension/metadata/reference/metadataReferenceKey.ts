/**
 * Metadata Reference key is comprised of the COLUMNFILEID, COLUMNPARENTID
 */
import { DBValue } from '../../../db/dbValue';

export class MetadataReferenceKey {
  /**
   * File ID
   */
  private columnFileId: DBValue;

  /**
   * Parent ID
   */
  private columnParentId: DBValue;

  /**
   * Constructor
   * @param columnFileId column file id
   * @param columnParentId column parent id
   */
  public constructor(columnFileId: DBValue, columnParentId: DBValue) {
    this.columnFileId = columnFileId;
    this.columnParentId = columnParentId;
  }

  /**
   * Get the column file id
   */
  getColumnFileId(): DBValue {
    return this.columnFileId;
  }

  /**
   * Set the column file id
   * @param value
   */
  setColumnFileId(value: DBValue): void {
    this.columnFileId = value;
  }

  /**
   * Get the column parent id
   */
  getColumnParentId(): DBValue {
    return this.columnParentId;
  }

  /**
   * Set the column parent id
   * @param value
   */
  setColumnParentId(value: DBValue): void {
    this.columnParentId = value;
  }

  /**
   * {@inheritDoc}
   */
  public toString(): string {
    return this.columnFileId + '-' + this.columnParentId;
  }

  /**
   * {@inheritDoc}
   */
  public equals(obj: MetadataReferenceKey): boolean {
    return obj.getColumnFileId() === this.getColumnFileId() && obj.getColumnParentId() === this.getColumnParentId();
  }
}
