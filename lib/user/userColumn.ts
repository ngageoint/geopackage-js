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

  constraints: Constraint[] = [];
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
    const userColumnCopy = new UserColumn(this.index, this.name, this.dataType, this.max, this.notNull, this.defaultValue, this.primaryKey);
    userColumnCopy.min = this.min;
    userColumnCopy.constraints = this.constraints.slice();
    return userColumnCopy;
  }

  /**
   * Clears the constraints
   */
  clearConstraints() {
    const constraintsCopy = this.constraints.slice();
    this.constraints = [];
    return constraintsCopy;
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
    this.notNull = notNull;
    const index = this.constraints.findIndex(constraint => constraint.getType() === ConstraintType.NOT_NULL);
    if (index >= 0) {
      this.constraints.splice(index, 1);
    }
    this.addConstraintSql('NOT NULL');
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
    this.defaultValue = defaultValue;
    const index = this.constraints.findIndex(constraint => constraint.getType() === ConstraintType.DEFAULT);
    if (index >= 0) {
      this.constraints.splice(index, 1);
    }
    this.addConstraintSql('DEFAULT ' + CoreSQLUtils.columnDefaultValue(defaultValue, this.getDataType()));
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
    this.primaryKey = primaryKey;
    const index = this.constraints.findIndex(constraint => constraint.getType() === ConstraintType.PRIMARY_KEY);
    if (index >= 0) {
      this.constraints.splice(index, 1);
    }
    this.addConstraintSql('PRIMARY KEY');
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
  protected setAutoincrement(autoincrement: boolean) {
    this.autoincrement = autoincrement;
    const index = this.constraints.findIndex(constraint => constraint.getType() === ConstraintType.AUTOINCREMENT);
    if (index >= 0) {
      this.constraints.splice(index, 1);
    }
    if (autoincrement) {
      this.addConstraintSql('AUTOINCREMENT');
    }
  }

  /**
   * Get the autoincrement flag
   * @return autoincrement flag
   */
  isAutoincrement(): boolean {
    return this.autoincrement;
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
  }

  /**
   * Add a constraint
   * @param constraint constraint
   */
  addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
  }

  /**
   * Add a constraint
   * @param constraint constraint
   */
  addConstraintSql(constraint: string) {
    const type = ConstraintParser.getType(constraint);
    const name = ConstraintParser.getName(constraint);
    this.constraints.push(new RawConstraint(type, name, constraint));
  }

  /**
   * Add constraints
   * @param constraints constraints
   */
  addConstraints(constraints: Constraint[]) {
    constraints.forEach(constraint => {
      this.addConstraint(constraint);
    })
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
  addNotNullConstraint() {
    this.setNotNull(true);
  }

  /**
   * Add a default value constraint
   * @param defaultValue default value
   */
  addDefaultValueConstraint(defaultValue: any) {
    this.setDefaultValue(defaultValue);
  }

  /**
   * Add a primary key constraint
   */
  addPrimaryKeyConstraint() {
    this.setPrimaryKey(true);
  }

  /**
   * Add an autoincrement constraint
   */
  addAutoincrementConstraint() {
    if (this.isPrimaryKey()) {
      this.setAutoincrement(true);
    } else {
      throw new Error('Autoincrement may only be set on primary key columns');
    }
  }

  /**
   * Add a unique constraint
   */
  addUniqueConstraint() {
    const index = this.constraints.findIndex(constraint => constraint.getType() === ConstraintType.UNIQUE);
    if (index >= 0) {
      this.constraints.splice(index, 1);
    }
    this.addConstraintSql('UNIQUE');
  }

  /**
   * Removes a unique constraint, if one exists
   */
  removeUniqueConstraint() {
    const index = this.constraints.findIndex(constraint => constraint.getType() === ConstraintType.UNIQUE);
    if (index >= 0) {
      this.constraints.splice(index, 1);
    }
  }

  getType(): string {
    return this.type;
  }

  hasConstraints() {
    return this.constraints.length > 0;
  }

  /**
   * Build the SQL for the constraint
   *
   * @param constraint
   *            constraint
   * @return SQL or null
   * @since 4.0.0
   */
  buildConstraintSql(constraint: Constraint): string {
    let sql = null;
    if (UserTable.DEFAULT_PK_NOT_NULL || !this.isPrimaryKey() || constraint.getType() !== ConstraintType.NOT_NULL) {
      sql = constraint.buildSql();
    }
    return sql;
  }
}
