import { StyleRow } from './styleRow';
import { IconRow } from './iconRow';

/**
 * FeatureStyle constructor
 * @param {module:extension/nga/style.StyleRow} styleRow
 * @param {module:extension/nga/style.IconRow} iconRow
 * @constructor
 */
export class FeatureStyle {
  constructor(public styleRow: StyleRow, public iconRow: IconRow) {}
  /**
   * Set style
   * @param {module:extension/nga/style.StyleRow} styleRow
   */
  set style(styleRow: StyleRow) {
    this.styleRow = styleRow;
  }
  /**
   * Get style
   * @returns {module:extension/nga/style.StyleRow}
   */
  get style(): StyleRow {
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
   * @param {module:extension/nga/style.IconRow} iconRow
   */
  set icon(iconRow: IconRow) {
    this.iconRow = iconRow;
  }
  /**
   * Get icon
   * @returns {module:extension/nga/style.IconRow}
   */
  get icon(): IconRow {
    return this.iconRow;
  }
  /**
   * Returns true if has icon
   * @returns {Boolean}
   */
  hasIcon(): boolean {
    return !!this.iconRow;
  }

  /**
   * Determine if an icon exists and should be used. Returns false when an
   * icon does not exist or when both a table level icon and row level style
   * exist.
   * @return true if the icon exists and should be used over a style
   */
  useIcon(): boolean {
    return this.hasIcon() && (!this.iconRow.isTableIcon() || !this.hasStyle() || this.styleRow.isTableStyle());
  }
}
