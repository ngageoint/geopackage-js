import { StyleRow } from './styleRow';
import { IconRow } from './iconRow';

/**
 * FeatureStyle constructor
 * @param {module:extension/style.StyleRow} styleRow
 * @param {module:extension/style.IconRow} iconRow
 * @constructor
 */
export class FeatureStyle {
  constructor(public styleRow: StyleRow, public iconRow: IconRow) {}
  /**
   * Set style
   * @param {module:extension/style.StyleRow} styleRow
   */
  setStyle(styleRow: StyleRow): void {
    this.styleRow = styleRow;
  }
  /**
   * Get style
   * @returns {module:extension/style.StyleRow}
   */
  getStyle(): StyleRow {
    return this.styleRow;
  }
  /**
   * Returns true if has style
   * @returns {Boolean}
   */
  hasStyle(): boolean {
    return !!this.styleRow;
  }
  /**
   * Set icon
   * @param {module:extension/style.IconRow} iconRow
   */
  setIcon(iconRow: IconRow): void {
    this.iconRow = iconRow;
  }
  /**
   * Get icon
   * @returns {module:extension/style.IconRow}
   */
  getIcon(): IconRow {
    return this.iconRow;
  }
  /**
   * Returns true if has icon
   * @returns {Boolean}
   */
  hasIcon(): boolean {
    return !!this.iconRow;
  }
}
