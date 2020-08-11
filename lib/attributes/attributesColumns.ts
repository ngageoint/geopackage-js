/**
 * @module attributes
 */

import { UserColumns } from '../user/userColumns';
import { AttributesColumn } from './attributesColumn';

/**
 * UserCustomColumns
 */
export class AttributesColumns extends UserColumns<AttributesColumn> {
  constructor(tableName: string, columns: AttributesColumn[], custom: boolean) {
    super(tableName, columns, custom);
    this.updateColumns();
  }

  copy(): AttributesColumns {
    return new AttributesColumns(this.getTableName(), this.getColumns(), this.isCustom());
  }
}
