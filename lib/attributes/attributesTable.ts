/**
 * @module attributes/attributesTable
 */
import { UserTable } from '../user/userTable';
import { Contents } from '../contents/contents';
import { AttributesColumn } from './attributesColumn';
import { AttributesColumns } from './attributesColumns';
import { ContentsDataType } from '../contents/contentsDataType';
import { GeoPackageException } from '../geoPackageException';
import { UserColumns } from '../user/userColumns';

/**
 * Represents a user attribute table
 */
export class AttributesTable extends UserTable<AttributesColumn> {
  contents: Contents;

  constructor(tableName: string, columns: AttributesColumn[]) {
    super(new AttributesColumns(tableName, columns, false));
  }

  /**
   * Set the contents
   * @param  {Contents} contents the contents
   */
  setContents(contents: Contents): boolean {
    this.contents = contents;
    if (contents.getDataType() !== ContentsDataType.ATTRIBUTES) {
      throw new GeoPackageException(
        `The Contents of an Attributes Table must have a data type of ${ContentsDataType.ATTRIBUTES}`,
      );
    }
    return true;
  }

  copy(): UserTable<AttributesColumn> {
    return new AttributesTable(this.getTableName(), this.columns.getColumns());
  }

  createUserColumns(columns: AttributesColumn[]): UserColumns<AttributesColumn> {
    return new AttributesColumns(this.getTableName(), columns, true);
  }

  getDataType(): string {
    return this.getDataTypeOrDefault(ContentsDataType.nameFromType(ContentsDataType.ATTRIBUTES));
  }
}
