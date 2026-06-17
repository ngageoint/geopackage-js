import { UserTableReader } from '../user/userTableReader';
import { AttributesTable } from './attributesTable';
import { UserColumn } from '../user/userColumn';
import { AttributesColumn } from './attributesColumn';
import { TableColumn } from '../db/table/tableColumn';
import type { GeoPackage } from '../geoPackage';

/**
 * Reads the metadata from an existing attribute table
 */
export class AttributesTableReader extends UserTableReader<AttributesColumn, AttributesTable> {
  constructor(table_name: string) {
    super(table_name);
  }

  /**
   * Read the attribute table
   * @param geoPackage
   */
  readAttributeTable(geoPackage: GeoPackage): AttributesTable {
    return this.readTable(geoPackage.getDatabase()) as AttributesTable;
  }

  /**
   * @inheritDoc
   */
  createTable(tableName: string, columns: UserColumn[]): AttributesTable {
    return new AttributesTable(tableName, columns);
  }

  /**
   * @inheritDoc
   */
  createColumn(tableColumn: TableColumn): AttributesColumn {
    return new AttributesColumn(tableColumn);
  }
}
