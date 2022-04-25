import { GeoPackageDataType } from './geoPackageDataType'
import isNil from 'lodash/isNil'
import isEqual from 'lodash/isEqual'

/**
 * Mapped column, to a column and potentially from a differently named column
 */
export class MappedColumn {
  /**
   * To column
   */
  _toColumn: string

  /**
   * From column or null if the same as to column
   */
  _fromColumn: string

  /**
   * Default to column value
   */
  _defaultValue: any

  /**
   * Column data type
   */
  _dataType: GeoPackageDataType

  /**
   * Constant value
   */
  _constantValue: any

  /**
   * Where value
   */
  _whereValue: any

  /**
   * Where value comparison operator (=, <, etc)
   */
  _whereOperator: string

  /**
   * Constructor
   *
   * @param toColumn to column
   * @param fromColumn from column
   * @param defaultValue default value
   * @param dataType data type
   */
  constructor (toColumn: string, fromColumn: string, defaultValue: any, dataType: GeoPackageDataType) {
    this._toColumn = toColumn
    this._fromColumn = fromColumn
    this._defaultValue = defaultValue
    this._dataType = dataType
  }

  /**
   * Get the to column
   * @return to column
   */
  get toColumn(): string {
    return this._toColumn
  }

  /**
   * Set the to column
   * @param toColumn to column
   */
  set toColumn(toColumn: string) {
    this._toColumn = toColumn
  }

  /**
   * Determine if the column has a new name
   *
   * @return true if the to and from column names are different
   */
  hasNewName(): boolean {
    return !isNil(this._fromColumn) && !isEqual(this._fromColumn, this._toColumn)
  }

  /**
   * Get the from column
   * @return from column
   */
  get fromColumn(): string {
    return this._fromColumn
  }

  /**
   * Set the from column
   * @param fromColumn to column
   */
  set fromColumn(fromColumn: string) {
    this._fromColumn = fromColumn
  }

  /**
   * Check if the column has a default value
   * @return true if has a default value
   */
  hasDefaultValue(): boolean {
    return !isNil(this._defaultValue)
  }

  /**
   * Get the default value
   * @return default value
   */
  get defaultValue(): any {
    return this._defaultValue
  }

  /**
   * Get the default value as a string
   * @return default value as string
   */
  getDefaultValueAsString(): string {
    return GeoPackageDataType.columnDefaultValue(this._defaultValue, this._dataType)
  }

  /**
   * Set the default value
   * @param defaultValue default value
   */
  set defaultValue(defaultValue: any) {
    this._defaultValue = defaultValue
  }

  /**
   * Get the data type
   * @return data type
   */
  get dataType(): GeoPackageDataType {
    return this._dataType
  }

  /**
   * Set the data type
   * @param dataType data type
   */
  set dataType(dataType: GeoPackageDataType) {
    this._dataType = dataType
  }

  /**
   * Check if the column has a constant value
   * @return true if has a constant value
   */
  hasConstantValue(): boolean {
    return !isNil(this._constantValue)
  }

  /**
   * Get the constant value
   * @return constant value
   */
  get constantValue(): any {
    return this._constantValue
  }

  /**
   * Get the constant value as a string
   * @return constant value as string
   */
  getConstantValueAsString(): string {
    return GeoPackageDataType.columnDefaultValue(this._constantValue, this._dataType)
  }

  /**
   * Set the constant value
   * @param constantValue constant value
   */
  set constantValue(constantValue: any) {
    this._constantValue = constantValue
  }

  /**
   * Check if the column has a where value
   * @return true if has a where value
   */
  hasWhereValue(): boolean {
    return !isNil(this._whereValue)
  }

  /**
   * Get the where value
   * @return where value
   */
  get whereValue(): any {
    return this._whereValue
  }

  /**
   * Get the where value as a string
   * @return where value as string
   */
  getWhereValueAsString(): string {
    return GeoPackageDataType.columnDefaultValue(this._whereValue, this._dataType)
  }

  /**
   * Set the where value
   * @param whereValue where value
   */
  set whereValue(whereValue: any) {
    this._whereValue = whereValue
  }

  /**
   * Set the where value
   * @param whereValue where value
   * @param whereOperator where operator
   */
  setWhereValueAndOperator(whereValue: any, whereOperator: string) {
    this._whereValue = whereValue
    this.whereOperator = whereOperator
  }

  /**
   * Get the where operator
   * @return where operator
   */
  get whereOperator(): string {
    return !isNil(this._whereOperator) ? this._whereOperator : '='
  }

  /**
   * Set the where operator
   * @param whereOperator where operator
   */
  set whereOperator(whereOperator: string) {
    this._whereOperator = whereOperator
  }
}
