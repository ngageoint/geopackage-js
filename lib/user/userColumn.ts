/**
 * @module user/userColumn
 */
import _ from 'lodash'
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { DBValue } from '../db/dbAdapter';
import { Constraint } from '../db/table/constraint';
import { RawConstraint } from '../db/table/rawConstraint';
import { ConstraintParser } from '../db/table/constraintParser';
import { ColumnConstraints } from '../db/table/columnConstraints';
import { CoreSQLUtils } from '../db/coreSQLUtils';
import { ConstraintType } from '../db/table/constraintType';
import { UserTable } from './userTable';
import { Constraints } from '../db/table/constraints';

/**
 * A `UserColumn` is meta-data about a single column from a {@link module:/user/userTable~UserTable}.
 *
 * @class
 * @param {Number} index column index
 * @param {string} name column name
 * @param {module:db/geoPackageDataType~GPKGDataType} dataType data type of the column
 * @param {?Number} max max value
 * @param {Boolean} notNull not null
 * @param {?Object} defaultValue default value or null
 * @param {Boolean} primaryKey `true` if this column is part of the table's primary key
 */
export class UserColumn {
  static readonly NO_INDEX = -1;
  /**
   * Not Null Constraint Order
   */
  static readonly NOT_NULL_CONSTRAINT_ORDER = 1;

  /**
   * Default Value Constraint Order
   */
  static readonly DEFAULT_VALUE_CONSTRAINT_ORDER = 2;

  /**
   * Primary Key Constraint Order
   */
  static readonly PRIMARY_KEY_CONSTRAINT_ORDER = 3;

  /**
   * Autoincrement Constraint Order
   */
  static readonly AUTOINCREMENT_CONSTRAINT_ORDER = 4;

  /**
   * Unique Constraint Order
   */
  static readonly UNIQUE_CONSTRAINT_ORDER = 5;

  constraints: Constraints = new Constraints();
  type: string;
  min: number;
  constructor(
    public index: number,
    public name: string,
    public dataType: GeoPackageDataType,
    public max?: number,
    public notNull?: boolean,
    public defaultValue?: DBValue,
    public primaryKey?: boolean,
    public autoincrement?: boolean,
    public unique?: boolean,
  ) {
    this.validateMax();
    this.type = this.getTypeName(name, dataType);
    this.addDefaultConstraints();
  }

  /**
   * Validate the data type
   * @param name column name
   * @param dataType  data type
   */
  static validateDataType(name: string, dataType: GeoPackageDataType) {
    if (dataType === null || dataType === undefined) {
      throw new Error('Data Type is required to create column: ' + name);
    }
  }

  /**
   * Copy the column
   * @return copied column
   */
  copy(): UserColumn {
    const userColumnCopy = new UserColumn(this.index, this.name, this.dataType, this.max, this.notNull, this.defaultValue, this.primaryKey, this.unique);
    userColumnCopy.min = this.min;
    userColumnCopy.constraints = this.constraints.copy();
    return userColumnCopy;
  }

  /**
   * Clears the constraints
   */
  clearConstraints() {
    return this.constraints.clear();
  }

  getConstraints() {
    return this.constraints;
  }

  setIndex(index: number) {
    if (this.hasIndex()) {
      if (!_.isEqual(index, this.index)) {
        throw new Error('User Column with a valid index may not be changed. Column Name: ' + this.name + ', Index: ' + this.index + ', Attempted Index: ' + this.index);
      }
    } else {
      this.index = index;
    }
  }

  /**
   * Check if the column has a valid index
   * @return true if has a valid index
   */
  hasIndex(): boolean {
    return this.index > UserColumn.NO_INDEX;
  }

  /**
   * Reset the column index
   */
  resetIndex() {
    this.index = UserColumn.NO_INDEX;
  }

  /**
   * Get the index
   *
   * @return index
   */
  getIndex(): number {
    return this.index;
  }

  /**
   * Set the name
   * @param name column name
   */
  setName(name: string) {
    this.name = name;
  }

  /**
   * Get the name
   * @return name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Determine if this column is named the provided name
   * @param name column name
   * @return true if named the provided name
   */
  isNamed(name: string): boolean {
    return this.name === name;
  }

  /**
   * Determine if the column has a max value
   * @return true if has max value
   */
  hasMax(): boolean {
    return this.max != null;
  }

  /**
   * Set the max
   * @param max max
   */
  setMax(max: number) {
    this.max = max;
  }

  /**
   * Get the max
   * @return max
   */
  getMax(): number {
    return this.max;
  }

  /**
   * Set the not null flag
   * @param notNull not null flag
   */
  setNotNull(notNull: boolean) {
    if (this.notNull !== notNull) {
      if (notNull) {
        this.addNotNullConstraint();
      } else {
        this.removeConstraintByType(ConstraintType.NOT_NULL);
      }
    }
    this.notNull = notNull;
  }

  /**
   * Get the is not null flag
   * @return not null flag
   */
  isNotNull(): boolean {
    return this.notNull;
  }

  /**
   * Determine if the column has a default value
   * @return true if has default value
   */
  hasDefaultValue(): boolean {
    return this.defaultValue !== null && this.defaultValue !== undefined;
  }

  /**
   * Set the default value
   * @param defaultValue default value
   */
  setDefaultValue(defaultValue: any) {
    this.removeConstraintByType(ConstraintType.DEFAULT);
    if (defaultValue !== null && defaultValue !== undefined) {
      this.addDefaultValueConstraint(defaultValue);
    }
    this.defaultValue = defaultValue;
  }

  /**
   * Get the default value
   * @return default value
   */
  getDefaultValue(): any {
    return this.defaultValue;
  }

  /**
   * Set the primary key flag
   * @param primaryKey primary key flag
   */
  setPrimaryKey(primaryKey: boolean) {
    if (this.primaryKey !== primaryKey) {
      if (primaryKey) {
        this.addPrimaryKeyConstraint();
      } else {
        this.autoincrement = false;
        this.removeConstraintByType(ConstraintType.AUTOINCREMENT);
        this.removeConstraintByType(ConstraintType.PRIMARY_KEY);
      }
    }
    this.primaryKey = primaryKey;
  }

  /**
   * Get the primary key flag
   * @return primary key flag
   */
  isPrimaryKey() {
    return this.primaryKey;
  }

  /**
   * Set the autoincrement flag
   * @param autoincrement autoincrement flag
   */
  setAutoincrement(autoincrement: boolean) {
    if (this.autoincrement !== autoincrement) {
      if (autoincrement) {
        this.addAutoincrementConstraint();
      } else {
        this.removeConstraintByType(ConstraintType.AUTOINCREMENT);
      }
    }
    this.autoincrement = autoincrement;
  }

  /**
   * Get the autoincrement flag
   * @return autoincrement flag
   */
  isAutoincrement(): boolean {
    return this.autoincrement;
  }


  /**
   * Set the unique flag
   * @param unique autoincrement flag
   */
  protected setUnique(unique: boolean) {
    if (this.unique !== unique) {
      if (unique) {
        this.addUniqueConstraint();
      } else {
        this.removeConstraintByType(ConstraintType.UNIQUE);
      }
    }
    this.unique = unique;
  }

  /**
   * Get the autoincrement flag
   * @return autoincrement flag
   */
  isUnique(): boolean {
    return this.unique;
  }

  /**
   * Set the data type
   * @param dataType data type
   */
  setDataType(dataType: GeoPackageDataType) {
    this.dataType = dataType;
  }

  /**
   * Get the data type
   * @return data type
   */
  getDataType(): GeoPackageDataType {
    return this.dataType;
  }

  getTypeName(name: string, dataType: GeoPackageDataType): string {
    UserColumn.validateDataType(name, dataType);
    return GeoPackageDataType.nameFromType(dataType);
  }

  /**
   * Validate that if max is set, the data type is text or blob
   */
  validateMax(): boolean {
    if (this.max && this.dataType !== GeoPackageDataType.TEXT && this.dataType !== GeoPackageDataType.BLOB) {
      throw new Error(
        'Column max is only supported for TEXT and BLOB columns. column: ' +
          this.name +
          ', max: ' +
          this.max +
          ', type: ' +
          this.dataType,
      );
    }
    return true;
  }

  /**
   *  Create a new primary key column
   *
   *  @param {Number} index column index
   *  @param {string} name  column name
   *  @param {boolean} autoincrement column autoincrement
   *
   *  @return {UserColumn} created column
   */
  static createPrimaryKeyColumn(index: number, name: string, autoincrement: boolean = UserTable.DEFAULT_AUTOINCREMENT): UserColumn {
    return new UserColumn(index, name, GeoPackageDataType.INTEGER, undefined, true, undefined, true, autoincrement);
  }

  /**
   *  Create a new column
   *
   *  @param {Number} index        column index
   *  @param {string} name         column name
   *  @param {module:db/geoPackageDataType~GPKGDataType} type         data type
   *  @param {Number} max max value
   *  @param {Boolean} notNull      not null
   *  @param {Object} defaultValue default value or nil
   *
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createColumn(
    index: number,
    name: string,
    type: GeoPackageDataType,
    notNull = false,
    defaultValue?: DBValue,
    max?: number,
  ): UserColumn {
    return new UserColumn(index, name, type, max, notNull, defaultValue, false);
  }

  /**
   * Add the default constraints that are enabled (not null, default value,
   * primary key, autoincrement) from the column properties
   */
  protected addDefaultConstraints() {
    if (this.isNotNull()) {
      this.addNotNullConstraint();
    }
    if (this.hasDefaultValue()) {
      this.addDefaultValueConstraint(this.getDefaultValue());
    }
    if (this.isPrimaryKey()) {
      this.addPrimaryKeyConstraint();
      if (this.isAutoincrement()) {
        this.addAutoincrementConstraint();
      }
    }
    if (this.isUnique()) {
      this.addUniqueConstraint();
    }
  }

  /**
   * Add a constraint
   * @param constraint constraint
   */
  addConstraint(constraint: Constraint) {
    if (constraint.order === null || constraint.order === undefined) {
      this.setConstraintOrder(constraint);
    }

    this.constraints.add(constraint);
  }

  /**
   * Set the constraint order by constraint type
   * @param constraint constraint
   */
  setConstraintOrder(constraint: Constraint) {
    let order = null;
    switch (constraint.getType()) {
      case ConstraintType.PRIMARY_KEY:
        order = UserColumn.PRIMARY_KEY_CONSTRAINT_ORDER;
        break;
      case ConstraintType.UNIQUE:
        order = UserColumn.UNIQUE_CONSTRAINT_ORDER;
        break;
      case ConstraintType.NOT_NULL:
        order = UserColumn.NOT_NULL_CONSTRAINT_ORDER;
        break;
      case ConstraintType.DEFAULT:
        order = UserColumn.DEFAULT_VALUE_CONSTRAINT_ORDER;
        break;
      case ConstraintType.AUTOINCREMENT:
        order = UserColumn.AUTOINCREMENT_CONSTRAINT_ORDER;
        break;
      default:
    }
    constraint.order = order;
  }

  /**
   * Add a constraint
   * @param constraint constraint
   */
  addConstraintSql(constraint: string) {
    const type = ConstraintParser.getType(constraint);
    const name = ConstraintParser.getName(constraint);
    this.constraints.add(new RawConstraint(type, name, constraint));
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraints(constraints: Constraints) {
    this.constraints.addConstraints(constraints);
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addColumnConstraints(constraints: ColumnConstraints) {
    this.addConstraints(constraints.getConstraints());
  }

  /**
   * Add a not null constraint
   */
  private addNotNullConstraint() {
    this.addConstraint(new RawConstraint(ConstraintType.NOT_NULL, null, "NOT NULL", UserColumn.NOT_NULL_CONSTRAINT_ORDER));
  }

  /**
   * Add a default value constraint
   * @param defaultValue default value
   */
  private addDefaultValueConstraint(defaultValue: any) {
    this.addConstraint(new RawConstraint(ConstraintType.DEFAULT, null, "DEFAULT " + CoreSQLUtils.columnDefaultValue(defaultValue, this.getDataType()), UserColumn.DEFAULT_VALUE_CONSTRAINT_ORDER));
  }

  /**
   * Add a primary key constraint
   */
  private addPrimaryKeyConstraint() {
    this.addConstraint(new RawConstraint(ConstraintType.PRIMARY_KEY, null, "PRIMARY KEY", UserColumn.PRIMARY_KEY_CONSTRAINT_ORDER));
  }

  /**
   * Add an autoincrement constraint
   */
  private addAutoincrementConstraint() {
    if (this.isPrimaryKey()) {
      this.addConstraint(new RawConstraint(ConstraintType.AUTOINCREMENT, null, "AUTOINCREMENT", UserColumn.AUTOINCREMENT_CONSTRAINT_ORDER));
    } else {
      throw new Error('Autoincrement may only be set on a primary key column');
    }
  }

  /**
   * Add a unique constraint
   */
  private addUniqueConstraint() {
    this.addConstraint(new RawConstraint(ConstraintType.UNIQUE, null, "UNIQUE", UserColumn.UNIQUE_CONSTRAINT_ORDER));
  }

  /**
   * Removes constraints by type
   */
  removeConstraintByType(type: ConstraintType) {
    this.constraints.clearConstraintsByType(type);
  }

  getType(): string {
    return this.type;
  }

  hasConstraints() {
    return this.constraints.has();
  }

  /**
   * Build the SQL for the constraint
   * @param constraint constraint
   * @return SQL or null
   */
  buildConstraintSql(constraint: Constraint): string {
    let sql = null;
    if (UserTable.DEFAULT_PK_NOT_NULL || !this.isPrimaryKey() || constraint.getType() !== ConstraintType.NOT_NULL) {
      sql = constraint.buildSql();
    }
    return sql;
  }
}
