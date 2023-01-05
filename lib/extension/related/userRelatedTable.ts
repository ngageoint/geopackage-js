/**
 * userRelatedTable module.
 * @module extension/relatedTables
 */
import { Contents } from '../../contents/contents';
import { UserCustomTable } from '../../user/custom/userCustomTable';
import { GeoPackageException } from '../../geoPackageException';
import { UserCustomColumn } from '../../user/custom/userCustomColumn';

/**
 * User Defined Related Table
 * @param  {string} tableName table name
 * @param  {array} columns   attribute columns
 */
/**
 * User Defined Related Table
 * @param  {string} tableName       table name
 * @param  {string} relationName    relation name
 * @param  {string} dataType        Contents data type
 * @param  {UserColumn} columns         columns
 * @param  {string[]} [requiredColumns] required columns
 * @return {UserRelatedTable}
 */
export class UserRelatedTable extends UserCustomTable {
  /**
   * Relation name
   */
  private readonly relation_name: string;

  /**
   * Contents data type
   */
  private readonly data_type: string;

  /**
   * Constructor
   * @param tableName  table name
   * @param relationName relation name
   * @param dataType contents data type
   * @param columns list of columns
   */
  public constructor(tableName: string, relationName: string, dataType: string, columns: UserCustomColumn[]);

  /**
   * Constructor
   *
   * @param tableName table name
   * @param relationName relation name
   * @param dataType contents data type
   * @param columns  list of columns
   * @param requiredColumns  list of required columns
   */
  public constructor(
    tableName: string,
    relationName: string,
    dataType: string,
    columns: UserCustomColumn[],
    requiredColumns: string[],
  );

  /**
   * Constructor
   * @param relationName relation name
   * @param dataType contents data type
   * @param userCustomTable user custom table
   */
  public constructor(relationName: string, dataType: string, userCustomTable: UserCustomTable);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 3) {
      const relationName = args[0];
      const dataType = args[1];
      const userCustomTable = args[2];
      super(userCustomTable);
      this.relation_name = relationName;
      this.data_type = dataType;
    } else if (args.length === 4) {
      const tableName = args[0];
      const relationName = args[1];
      const dataType = args[2];
      const columns = args[3];
      super(tableName, columns, null);
      this.relation_name = relationName;
      this.data_type = dataType;
    } else if (args.length === 5) {
      const tableName = args[0];
      const relationName = args[1];
      const dataType = args[2];
      const columns = args[3];
      const requiredColumns = args[4];
      super(tableName, columns, requiredColumns);
      this.relation_name = relationName;
      this.data_type = dataType;
    }
  }

  /**
   * Get the relation name
   *
   * @return relation name
   */
  public getRelationName(): string {
    return this.relation_name;
  }

  /**
   * Get the data type
   */
  public getDataType(): string {
    return this.data_type;
  }

  /**
   * Get the table type
   */
  get tableType(): string {
    return 'userRelatedTable';
  }

  /**
   * {@inheritDoc}
   */
  protected validateContents(contents: Contents): void {
    // Verify the Contents have a relation name data type
    const contentsDataType = contents.getDataTypeName();
    if (contentsDataType == null || contentsDataType !== this.getDataType()) {
      throw new GeoPackageException('The Contents of a must have a data type of ' + this.getDataType());
    }
  }
}
