/**
 * tileTableReader module.
 * @module tiles/user/tileTableReader
 */
import UserTableReader from '../../user/userTableReader';
import TileTable from './tileTable';
import TileColumn from './tileColumn';

import DataTypes from '../../db/dataTypes';

/**
* Reads the metadata from an existing tile table
* @class TileTableReader
*/
export default class TileTableReader extends UserTableReader {
  tileMatrixSet: any;
  constructor(tileMatrixSet) {
    super(tileMatrixSet.table_name);
    this.tileMatrixSet = tileMatrixSet;
  }
  readTileTable(geoPackage) {
    return this.readTable(geoPackage.getDatabase());
  }
  createTable(tableName, columns) {
    return new TileTable(tableName, columns);
  }
  createColumnWithResults(results, index, name, type, max, notNull, defaultValueIndex, primaryKey) {
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
