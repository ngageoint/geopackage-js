import { UserTableReader } from '../../user/userTableReader';
import { TileTable } from './tileTable';
import { TileColumn } from './tileColumn';
import { TableColumn } from '../../db/table/tableColumn';
import type { GeoPackage } from '../../geoPackage';

/**
 * Reads the metadata from an existing tile table
 * @class TileTableReader
 */
export class TileTableReader extends UserTableReader<TileColumn, TileTable> {
  constructor(tableName: string) {
    super(tableName);
  }

  readTileTable(geoPackage: GeoPackage): TileTable {
    return this.readTable(geoPackage.getDatabase()) as TileTable;
  }

  /**
   * @inheritDoc
   */
  createTable(tableName: string, columns: TileColumn[]): TileTable {
    return new TileTable(tableName, columns);
  }

  /**
   * @inheritDoc
   */
  createColumn(tableColumn: TableColumn): TileColumn {
    return new TileColumn(
      tableColumn.index,
      tableColumn.name,
      tableColumn.dataType,
      tableColumn.max,
      tableColumn.notNull,
      tableColumn.defaultValue,
      tableColumn.primaryKey,
      tableColumn.autoincrement,
    );
  }
}
