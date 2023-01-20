/**
 * @module user/userColumn
 */
import { GeoPackageDataType } from '../db/geoPackageDataType';
import { Constraint } from '../db/table/constraint';
import { RawConstraint } from '../db/table/rawConstraint';
import { ColumnConstraints } from '../db/table/columnConstraints';
import { ConstraintType } from '../db/table/constraintType';
import { Constraints } from '../db/table/constraints';
import { TableColumn } from '../db/table/tableColumn';
import { UserTable } from './userTable';
import { GeoPackageException } from '../geoPackageException';
import { Comparable } from '@ngageoint/simple-features-js';
import { ConstraintParser } from '../db/table/constraintParser';

/**
 * A `UserColumn` is meta-data about a single column from a {@link UserTable}.
 *
 * @class
 * @param {Number} index column index
 * @param {string} name column name
 * @param {GPKGDataType} dataType data type of the column
 * @param {?Number} max max value
 * @param {Boolean} notNull not null
 * @param {?Object} defaultValue default value or null
 * @param {Boolean} primaryKey `true` if this column is part of the table's primary key
 */
export abstract class UserColumn implements Comparable<UserColumn> {
  /**
   * User Column index value
   */
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

  /**
   * Column index
   */
  private index: number;

  /**
   * Column name
   */
  private name: string;

  /**
   * Max size
   */
  private max: number;

  /**
   * True if a not null column
   */
  private notNull: boolean;

  /**
   * Default column value
   */
  private defaultValue: any;

  /**
   * True if a primary key column
   */
  private primaryKey: boolean;

  /**
   * True if primary key is autoincrement
   */
  private autoincrement: boolean;

  /**
   * True if unique column
   */
  private unique: boolean;

  /**
   * Type
   */
  private type: string;

  /**
   * Data type
   */
  private dataType: GeoPackageDataType;

  /**
   * List of column constraints
   */
  private readonly constraints: Constraints;

  /**
   * Constructor
   * @param index column index
   * @param name column name
   * @param dataType data type
   * @param max  max value
   * @param notNull not null flag
   * @param defaultValue default value
   * @param primaryKey primary key flag
   * @param autoincrement autoincrement flag
   */
  protected constructor(
    index: number,
    name: string,
    dataType: GeoPackageDataType,
    max: number,
    notNull: boolean,
    defaultValue: any,
    primaryKey: boolean,
    autoincrement: boolean,
  );

  /**
   * Constructor
   * @param index column index
   * @param name column name
   * @param type string type
   * @param dataType data type
   * @param max max value
   * @param notNull not null flag
   * @param defaultValue default value
   * @param primaryKey primary key flag
   * @param autoincrement autoincrement flag
   */
  protected constructor(
    index: number,
    name: string,
    type: string,
    dataType: GeoPackageDataType,
    max: number,
    notNull: boolean,
    defaultValue: any,
    primaryKey: boolean,
    autoincrement: boolean,
  );

  /**
   * Constructor
   *
   * @param tableColumn
   *            table column
   */
  protected constructor(tableColumn: TableColumn);
  protected constructor(userColumn: UserColumn);

  /**
   * Constructor
   * @param args
   */
  protected constructor(...args) {
    if (args.length === 1) {
      if (args[0] instanceof TableColumn) {
        const tableColumn = args[0];
        this.index = tableColumn.index != null ? tableColumn.index : UserColumn.NO_INDEX;
        this.name = tableColumn.name;
        this.max = tableColumn.max;
        this.notNull = tableColumn.isNotNull() || tableColumn.isPrimaryKey();
        this.defaultValue = tableColumn.defaultValue;
        this.primaryKey = tableColumn.primaryKey;
        this.autoincrement = tableColumn.isPrimaryKey() && UserTable.DEFAULT_AUTOINCREMENT;
        this.type = tableColumn.type;
        this.dataType = tableColumn.dataType;
        this.constraints = new Constraints();
        UserColumn.validateDataType(this.name, this.dataType);
        this.validateMax();
        this.addDefaultConstraints();
      } else if (args[0] instanceof UserColumn) {
        const userColumn = args[0];
        this.index = userColumn.index != null ? userColumn.index : UserColumn.NO_INDEX;
        this.name = userColumn.name;
        this.max = userColumn.max;
        this.notNull = userColumn.notNull;
        this.defaultValue = userColumn.defaultValue;
        this.primaryKey = userColumn.primaryKey;
        this.autoincrement = userColumn.autoincrement;
        this.type = userColumn.type;
        this.dataType = userColumn.dataType;
        this.constraints = userColumn.constraints.copy();
      }
    } else if (args.length === 8) {
      this.index = args[0] != null ? args[0] : UserColumn.NO_INDEX;
      this.name = args[1];
      this.type = UserColumn.getTypeName(args[1], args[2]);
      this.dataType = args[2];
      this.max = args[3];
      this.notNull = args[4];
      this.defaultValue = args[5];
      this.primaryKey = args[6];
      this.autoincrement = args[7];
      this.constraints = new Constraints();
      UserColumn.validateDataType(this.name, this.dataType);
      this.validateMax();
      this.addDefaultConstraints();
    } else if (args.length === 9) {
      this.index = args[0] != null ? args[0] : UserColumn.NO_INDEX;
      this.name = args[1];
      this.type = args[2];
      this.dataType = args[3];
      this.max = args[4];
      this.notNull = args[5];
      this.defaultValue = args[6];
      this.primaryKey = args[7];
      this.autoincrement = args[8];
      this.constraints = new Constraints();
      UserColumn.validateDataType(this.name, this.dataType);
      this.validateMax();
      this.addDefaultConstraints();
    }
  }

  /**
   * Get the type name from the data type
   *
   * @param name
   *            column name
   * @param dataType
   *            data type
   * @return type name

   */
  protected static getTypeName(name: string, dataType: GeoPackageDataType): string {
    UserColumn.validateDataType(name, dataType);
    return GeoPackageDataType.nameFromType(dataType);
  }

  /**
   * Validate the data type
   *
   * @param name
   *            column name
   *
   * @param dataType
   *            data type
   */
  protected static validateDataType(name: string, dataType: GeoPackageDataType): void {
    if (dataType == null) {
      console.error('Column is missing a data type: ' + name);
    }
  }

  /**
   * Copy the column
   *
   * @return copied column
   */
  public abstract copy(): UserColumn;

  /**
   * Check if the column has a valid index
   *
   * @return true if has a valid index
   */
  public hasIndex(): boolean {
    return this.index > UserColumn.NO_INDEX;
  }

  /**
   * Set the column index. Only allowed when {@link #hasIndex()} is false (
   * {@link #getIndex()} is {@link #NO_INDEX}). Setting a valid index to an
   * existing valid index does nothing.
   *
   * @param index
   *            column index
   */
  public setIndex(index: number): void {
    if (this.hasIndex()) {
      if (index != this.index) {
        throw new GeoPackageException(
          'User Column with a valid index may not be changed. Column Name: ' +
            this.name +
            ', Index: ' +
            this.index +
            ', Attempted Index: ' +
            index,
        );
      }
    } else {
      this.index = index;
    }
  }

  /**
   * Reset the column index
   */
  public resetIndex(): void {
    this.index = UserColumn.NO_INDEX;
  }

  /**
   * Get the index
   *
   * @return index
   */
  public getIndex(): number {
    return this.index;
  }

  /**
   * Set the name
   *
   * @param name
   *            column name
   */
  public setName(name: string): void {
    this.name = name;
  }

  /**
   * Get the name
   *
   * @return name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Determine if this column is named the provided name
   *
   * @param name
   *            column name
   * @return true if named the provided name
   */
  public isNamed(name: string): boolean {
    return this.name === name;
  }

  /**
   * Determine if the column has a max value
   *
   * @return true if has max value
   */
  public hasMax(): boolean {
    return this.max != null;
  }

  /**
   * Set the max
   *
   * @param max
   *            max

   */
  public setMax(max: number): void {
    this.max = max;
  }

  /**
   * Get the max
   *
   * @return max
   */
  public getMax(): number {
    return this.max;
  }

  /**
   * Set the not null flag
   *
   * @param notNull
   *            not null flag

   */
  public setNotNull(notNull: boolean): void {
    if (this.notNull != notNull) {
      if (notNull) {
        this.addNotNullConstraint();
      } else {
        this.removeNotNullConstraint();
      }
    }
    this.notNull = notNull;
  }

  /**
   * Get the is not null flag
   *
   * @return not null flag
   */
  public isNotNull(): boolean {
    return this.notNull;
  }

  /**
   * Determine if the column has a default value
   *
   * @return true if has default value
   */
  public hasDefaultValue(): boolean {
    return this.defaultValue != null;
  }

  /**
   * Set the default value
   *
   * @param defaultValue
   *            default value
   */
  public setDefaultValue(defaultValue: any): void {
    this.removeDefaultValueConstraint();
    if (defaultValue != null) {
      this.addDefaultValueConstraint(defaultValue);
    }
    this.defaultValue = defaultValue;
  }

  /**
   * Get the default value
   *
   * @return default value
   */
  public getDefaultValue(): any {
    return this.defaultValue;
  }

  /**
   * Set the primary key flag
   *
   * @param primaryKey
   *            primary key flag
   */
  public setPrimaryKey(primaryKey: boolean): void {
    if (this.primaryKey != primaryKey) {
      if (primaryKey) {
        this.addPrimaryKeyConstraint();
      } else {
        this.removeAutoincrementConstraint();
        this.removePrimaryKeyConstraint();
      }
    }
    this.primaryKey = primaryKey;
  }

  /**
   * Get the primary key flag
   *
   * @return primary key flag
   */
  public isPrimaryKey(): boolean {
    return this.primaryKey;
  }

  /**
   * Set the autoincrement flag
   *
   * @param autoincrement
   *            autoincrement flag
   */
  public setAutoincrement(autoincrement: boolean): void {
    if (this.autoincrement != autoincrement) {
      if (autoincrement) {
        this.addAutoincrementConstraint();
      } else {
        this.removeAutoincrementConstraint();
      }
    }
    this.autoincrement = autoincrement;
  }

  /**
   * Get the autoincrement flag
   *
   * @return autoincrement flag
   */
  public isAutoincrement(): boolean {
    return this.autoincrement;
  }

  /**
   * Set the unique flag
   *
   * @param unique
   *            unique flag
   */
  public setUnique(unique: boolean): void {
    if (this.unique != unique) {
      if (unique) {
        this.addUniqueConstraint();
      } else {
        this.removeUniqueConstraint();
      }
    }
    this.unique = unique;
  }

  /**
   * Get the unique flag
   *
   * @return unique flag
   */
  public isUnique(): boolean {
    return this.unique;
  }

  /**
   * Set the data type
   *
   * @param dataType
   *            data type
   */
  public setDataType(dataType: GeoPackageDataType): void {
    this.dataType = dataType;
  }

  /**
   * Get the data type
   *
   * @return data type
   */
  public getDataType(): GeoPackageDataType {
    return this.dataType;
  }

  /**
   * Set the database type
   *
   * @param type
   *            database type
   */
  public setType(type: string): void {
    this.type = type;
  }

  /**
   * Get the database type
   *
   * @return type
   */
  public getType(): string {
    return this.type;
  }

  /**
   * Check if has constraints
   *
   * @return true if has constraints
   */
  public hasConstraints(): boolean {
    return this.constraints.has();
  }

  /**
   * Check if has constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return true if has constraints
   */
  public hasConstraintsForType(type: ConstraintType): boolean {
    return this.constraints.hasType(type);
  }

  /**
   * Get the constraints
   *
   * @return constraints
   */
  public getConstraints(): Constraints {
    return this.constraints;
  }

  /**
   * Get the constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return constraints

   */
  public getConstraintsForType(type: ConstraintType): Constraint[] {
    return this.constraints.getConstraintsByType(type);
  }

  /**
   * Clear the constraints
   *
   * @param reset true to reset constraint settings
   * @return cleared constraints
   */
  public clearConstraints(reset = true): Constraint[] {
    if (reset) {
      this.primaryKey = false;
      this.unique = false;
      this.notNull = false;
      this.defaultValue = null;
      this.autoincrement = false;
    }

    return this.constraints.clear();
  }

  /**
   * Clear the constraints of the provided type
   *
   * @param type
   *            constraint type
   * @return cleared constraints
   */
  public clearConstraintsForType(type: ConstraintType): Constraint[] {
    switch (type) {
      case ConstraintType.PRIMARY_KEY:
        this.primaryKey = false;
        break;
      case ConstraintType.UNIQUE:
        this.unique = false;
        break;
      case ConstraintType.NOT_NULL:
        this.notNull = false;
        break;
      case ConstraintType.DEFAULT:
        this.defaultValue = null;
        break;
      case ConstraintType.AUTOINCREMENT:
        this.autoincrement = false;
        break;
      default:
    }

    return this.constraints.clearConstraintsByType(type);
  }

  /**
   * Add the default constraints that are enabled (not null, default value,
   * primary key) from the column properties
   */
  public addDefaultConstraints(): void {
    if (this.isNotNull()) {
      this.addNotNullConstraint();
    }
    if (this.hasDefaultValue()) {
      this.addDefaultValueConstraint(this.getDefaultValue());
    }
    if (this.isPrimaryKey()) {
      this.addPrimaryKeyConstraint();
    }
    if (this.isAutoincrement()) {
      this.addAutoincrementConstraint();
    }
  }

  /**
   * Add a constraint
   *
   * @param constraint
   *            constraint
   */
  public addConstraint(constraint: Constraint): void {
    if (constraint.order == null) {
      this.setConstraintOrder(constraint);
    }

    this.constraints.add(constraint);

    switch (constraint.getType()) {
      case ConstraintType.PRIMARY_KEY:
        this.primaryKey = true;
        break;
      case ConstraintType.UNIQUE:
        this.unique = true;
        break;
      case ConstraintType.NOT_NULL:
        this.notNull = true;
        break;
      case ConstraintType.DEFAULT:
        break;
      case ConstraintType.AUTOINCREMENT:
        this.autoincrement = true;
        break;
      default:
    }
  }

  /**
   * Set the constraint order by constraint type
   *
   * @param constraint
   *            constraint
   */
  public setConstraintOrder(constraint: Constraint): void {
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

    constraint.setOrder(order);
  }

  /**
   * Add a constraint
   * @param constraint  constraint
   */
  public addConstraintSql(constraint: string): void {
    const type = ConstraintParser.getType(constraint);
    const name = ConstraintParser.getName(constraint);
    this.constraints.add(new RawConstraint(type, name, constraint));
  }

  /**
   * Add a constraint
   *
   * @param type
   *            constraint type
   * @param constraint
   *            constraint
   * @param order
   *            constraint order
   */
  public addConstraintFrom(type: ConstraintType, constraint: string, order: number = null): void {
    const name = ConstraintParser.getName(constraint);
    this.addConstraint(new RawConstraint(type, name, constraint, order));
  }

  /**
   * Add constraints
   *
   * @param constraints constraints
   */
  public addConstraintsArray(constraints: Constraint[]): void {
    for (const constraint of constraints) {
      this.addConstraint(constraint);
    }
  }

  /**
   * Add constraints
   *
   * @param constraints
   *            constraints
   */
  public addConstraintsFromColumnConstraints(constraints: ColumnConstraints): void {
    this.addConstraints(constraints.getConstraints());
  }

  /**
   * Add constraints
   *
   * @param constraints
   *            constraints

   */
  public addConstraints(constraints: Constraints): void {
    this.addConstraintsArray(constraints.all());
  }

  /**
   * Add a not null constraint
   */
  public addNotNullConstraint(): void {
    this.addConstraintFrom(ConstraintType.NOT_NULL, 'NOT NULL', UserColumn.NOT_NULL_CONSTRAINT_ORDER);
  }

  /**
   * Remove a not null constraint
   */
  public removeNotNullConstraint(): void {
    this.clearConstraintsForType(ConstraintType.NOT_NULL);
  }

  /**
   * Add a default value constraint
   *
   * @param defaultValue
   *            default value
   */
  public addDefaultValueConstraint(defaultValue: any): void {
    this.addConstraintFrom(
      ConstraintType.DEFAULT,
      'DEFAULT ' + GeoPackageDataType.columnDefaultValue(defaultValue, this.getDataType()),
      UserColumn.DEFAULT_VALUE_CONSTRAINT_ORDER,
    );
  }

  /**
   * Remove a default value constraint
   */
  public removeDefaultValueConstraint(): void {
    this.clearConstraintsForType(ConstraintType.DEFAULT);
  }

  /**
   * Add a primary key constraint
   */
  public addPrimaryKeyConstraint(): void {
    this.addConstraintFrom(ConstraintType.PRIMARY_KEY, 'PRIMARY KEY', UserColumn.PRIMARY_KEY_CONSTRAINT_ORDER);
  }

  /**
   * Remove a primary key constraint
   */
  public removePrimaryKeyConstraint(): void {
    this.clearConstraintsForType(ConstraintType.PRIMARY_KEY);
  }

  /**
   * Add an autoincrement constraint
   */
  public addAutoincrementConstraint(): void {
    this.addConstraintFrom(ConstraintType.AUTOINCREMENT, 'AUTOINCREMENT', UserColumn.AUTOINCREMENT_CONSTRAINT_ORDER);
  }

  /**
   * Remove an autoincrement constraint
   */
  public removeAutoincrementConstraint(): void {
    this.clearConstraintsForType(ConstraintType.AUTOINCREMENT);
  }

  /**
   * Add a unique constraint
   */
  public addUniqueConstraint(): void {
    this.addConstraintFrom(ConstraintType.UNIQUE, 'UNIQUE', UserColumn.UNIQUE_CONSTRAINT_ORDER);
  }

  /**
   * Remove a unique constraint
   */
  public removeUniqueConstraint(): void {
    this.clearConstraintsForType(ConstraintType.UNIQUE);
  }

  /**
   * Build the SQL for the constraint
   *
   * @param constraint
   *            constraint
   * @return SQL or null

   */
  public buildConstraintSql(constraint: Constraint): string {
    let sql = null;
    if (UserTable.DEFAULT_PK_NOT_NULL || !this.isPrimaryKey() || constraint.getType() != ConstraintType.NOT_NULL) {
      sql = constraint.buildSql();
    }
    return sql;
  }

  /**
   * {@inheritDoc}
   * <p>
   * Sort by index
   */
  public compareTo(another: UserColumn): number {
    return this.index - another.index;
  }

  /**
   * Validate that if max is set, the data type is text or blob
   */
  private validateMax(): void {
    if (this.max != null) {
      if (this.dataType == null) {
        console.error('Column max set on a column without a data type. column: ' + name + ', max: ' + this.max);
      } else if (this.dataType !== GeoPackageDataType.TEXT && this.dataType !== GeoPackageDataType.BLOB) {
        throw new GeoPackageException(
          'Column max is only supported for ' +
            GeoPackageDataType.nameFromType(GeoPackageDataType.TEXT) +
            ' and ' +
            GeoPackageDataType.nameFromType(GeoPackageDataType.BLOB) +
            ' columns. column: ' +
            this.name +
            ', max: ' +
            this.max +
            ', type: ' +
            GeoPackageDataType.nameFromType(this.dataType),
        );
      }
    }
  }
}
