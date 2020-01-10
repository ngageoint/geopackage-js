/**
 * tileTableReader module.
 * @module tiles/user/tileTableReader
 */
import UserTableReader from '../../user/userTableReader';
import TileTable from './tileTable';
import TileColumn from './tileColumn';

import DataTypes from '../../db/dataTypes';
import { TileMatrixSet } from '../matrixset/tileMatrixSet';
import GeoPackage from '../../geoPackage';

/**
* Reads the metadata from an existing tile table
* @class TileTableReader
*/
export default class TileTableReader extends UserTableReader {
  constructor(public tileMatrixSet: TileMatrixSet) {
    super(tileMatrixSet.table_name);
  }
  readTileTable(geoPackage: GeoPackage) {
    return this.readTable(geoPackage.getDatabase());
  }
  createTable(tableName: string, columns: TileColumn[]) {
    return new TileTable(tableName, columns);
  }
  createColumnWithResults(results: any, index: number, name: string, type: string, max?: number, notNull?: boolean, defaultValueIndex?: number, primaryKey?: boolean): TileColumn {
    var dataType = DataTypes.fromName(type);
    var defaultValue = undefined;
    if (defaultValueIndex) {
      // console.log('default value index', defaultValueIndex);
      // console.log('result', results);
    }
    var column = new TileColumn(index, name, dataType, max, notNull, defaultValue, primaryKey);
    return column;
  }
}
