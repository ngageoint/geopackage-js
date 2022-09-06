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
import { BoundingBox } from '../boundingBox';
import { Projection } from '@ngageoint/projections-js';
import type { GeoPackage } from '../geoPackage';

/**
 * Attribute DAO for reading attribute user data tables
 */
export class AttributesDao extends UserDao<AttributesColumn, AttributesTable, AttributesRow, AttributesResultSet> {
  /**
   * Attributes connection
   */
  private readonly attributesDb: AttributesConnection;

  /**
   * Constructor
   * @param database
   * @param geoPackage
   * @param table
   */
  constructor(database: string, geoPackage: GeoPackage, table: AttributesTable) {
    super(database, geoPackage, new AttributesConnection(geoPackage.getConnection()), table);

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
