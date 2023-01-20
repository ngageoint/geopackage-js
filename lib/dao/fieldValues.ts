/**
 * Structure to define fields in a table
 * @class FieldValues
 */
export class FieldValues {
  values: { [key: number]: any } = {};
  columns: string[] = [];

  /**
   * Adds a field's value to the structure
   * @param  {string} field  name of field
   * @param  {UserColumn} value
   */
  addFieldValue(field: string, value: any): void {
    this.columns.push(field);
    this.values[this.columns.length - 1] = value;
  }
}
