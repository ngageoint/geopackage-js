/**
 * @module user/userColumn
 */
import _ from 'lodash'
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { DBValue } from '../db/dbAdapter';
import { Constraint } from '../db/table/constraint';
import {RawConstraint} from "../db/table/rawConstraint";
import {ConstraintParser} from "../db/table/constraintParser";
import {ColumnConstraints} from "../db/table/columnConstraints";
import {CoreSQLUtils} from "../db/coreSQLUtils";

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

  min: number;
  constraints: Constraint[] = [];
  type: string;
  constructor(
    public index: number,
    public name: string,
    public dataType: GeoPackageDataType,
    public max?: number,
    public notNull?: boolean,
    public defaultValue?: DBValue,
    public primaryKey?: boolean,
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
    return userColumnCopy;
  }

  /**
   * Clears the constraints
   */
  clearConstraints() {
    const constraintsCopy = Array.from(this.constraints);
    this.constraints = [];
    return constraintsCopy;
  }

  getConstraints() {
    return this.constraints;
  }

  setIndex(index: number) {
    if (!_.isNil(this.index)) {
      if (!_.isEqual(index, this.index)) {
        throw new Error("User Column with a valid index may not be changed. Column Name: " + this.name + ", Index: " + this.index + ", Attempted Index: " + this.index);
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
  }

  /**
   * Get the primary key flag
   * @return primary key flag
   */
  isPrimaryKey() {
    return this.primaryKey;
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
   *
   *  @return {module:user/userColumn~UserColumn} created column
   */
  static createPrimaryKeyColumnWithIndexAndName(index: number, name: string): UserColumn {
    return new UserColumn(index, name, GeoPackageDataType.INTEGER, undefined, true, undefined, true);
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
   * primary key) from the column properties
   */
  addDefaultConstraints() {
    if (this.isNotNull()) {
      this.addNotNullConstraint();
    }
    if (this.hasDefaultValue()) {
      this.addDefaultValueConstraint(this.getDefaultValue());
    }
    if (this.isPrimaryKey()) {
      this.addPrimaryKeyConstraint();
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
    this.addConstraintSql('NOT NULL');
  }

  /**
   * Add a default value constraint
   * @param defaultValue default value
   */
  addDefaultValueConstraint(defaultValue: any) {
    this.setDefaultValue(defaultValue);
    this.addConstraintSql('DEFAULT ' + CoreSQLUtils.columnDefaultValue(defaultValue, this.getDataType()));
  }

  /**
   * Add a primary key constraint
   */
  addPrimaryKeyConstraint() {
    this.setPrimaryKey(true);
    this.addConstraintSql('PRIMARY KEY AUTOINCREMENT');
  }

  /**
   * Add a unique constraint
   */
  addUniqueConstraint() {
    this.addConstraintSql('UNIQUE');
  }

  getType(): string {
    return this.type;
  }

  hasConstraints() {
    return this.constraints.length > 0;
  }
}
