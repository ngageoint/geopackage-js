/**
 * @module attributes/attributesDao
 */
import { UserDao } from '../user/userDao';
import { AttributesTable } from './attributesTable';
import { AttributesRow } from './attributesRow';
import { AttributesConnection } from './attributesConnection';
import { AttributesColumn } from './attributesColumn';
import { AttributesResultSet } from './attributesResultSet';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageConnection } from '../db/geoPackageConnection';
import { BoundingBox } from '../boundingBox';
import { Projection } from '@ngageoint/projections-js';

/**
 * Attribute DAO for reading attribute user data tables
 * @class AttributesDao
 * @extends UserDao
 * @param  {module:geoPackage~GeoPackage} geoPackage              geopackage object
 * @param  {module:attributes/attributesTable~AttributeTable} table           attribute table
 */
export class AttributesDao extends UserDao<AttributesColumn, AttributesTable, AttributesRow, AttributesResultSet> {
  /**
   * Attributes connection
   */
  private readonly attributesDb: AttributesConnection;

  constructor(database: string, db: GeoPackageConnection, table: AttributesTable) {
    super(database, db, new AttributesConnection(db), table);

    this.attributesDb = this.getUserDb() as AttributesConnection;
    if (table.getContents() == null) {
      throw new GeoPackageException('AttributesTable ' + table.getTableName() + ' has null Contents');
    }
  }

  /**
   * {@inheritDoc}
   * <p>
   * Not supported for Attributes
   */
  public getBoundingBox(): BoundingBox {
    throw new GeoPackageException('Bounding Box not supported for Attributes');
  }

  /**
   * {@inheritDoc}
   */
  public getBoundingBoxWithProjection(projection: Projection): BoundingBox {
    throw new GeoPackageException('Bounding Box not supported for Attributes');
  }

  getTable(): AttributesTable {
    return super.getTable() as AttributesTable;
  }

  /**
   * Create a new attribute row with the column types and values
   */
  newRow(): AttributesRow {
    return new AttributesRow(this.getTable());
  }

  /**
   * Get the Attributes connection
   *
   * @return attributes connection
   */
  public getAttributesDb(): AttributesConnection {
    return this.attributesDb;
  }
}
