import { UserConnection } from '../user/userConnection';
import { AttributesColumn } from './attributesColumn';
import { AttributesTable } from './attributesTable';
import { AttributesRow } from './attributesRow';
import { AttributesResultSet } from './attributesResultSet';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { ResultSet } from '../db/resultSet';

/**
 * GeoPackage Attributes Connection
 */
export class AttributesConnection extends UserConnection<
  AttributesColumn,
  AttributesTable,
  AttributesRow,
  AttributesResultSet
> {
  /**
   * Constructor
   * @param database GeoPackage connection
   */
  public constructor(database: GeoPackageConnection) {
    super(database);
  }

  /**
   * {@inheritDoc}
   */
  protected createResult(
    columns: string[],
    resultSet: ResultSet,
    sql: string,
    selectionArgs: string[],
  ): AttributesResultSet {
    return new AttributesResultSet(this.table, columns, resultSet, sql, selectionArgs);
  }
}
