/**
 * @module user/custom
 */
import {UserTable} from '../userTable';
import {UserColumn} from '../userColumn';

/**
 * Create a new user custom table
 * @class
 * @param  {string} tableName       table name
 * @param  {module:user/userColumn~UserColumn[]} columns         user columns
 * @param  {string[]} requiredColumns required columns
 */
export class UserCustomTable extends UserTable {
  constructor(tableName: string, columns: UserColumn[], requiredColumns: string[]) {
    super(tableName, columns);
    if (requiredColumns && requiredColumns.length) {
      var found = {};
      for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        if (requiredColumns.indexOf(column.name) !== -1) {
          var previousIndex = found[column.name];
          this.duplicateCheck(column.index, previousIndex, column.name);
          found[column.name] = column.index;
        }
      }
      for (i = 0; i < requiredColumns.length; i++) {
        this.missingCheck(found[requiredColumns[i]], requiredColumns[i]);
      }
    }
  }
}