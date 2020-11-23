import { StyleRow } from './styleRow';

/**
 * Styles constructor
 * @constructor
 */
export class Styles {
  defaultStyle: StyleRow = null;
  styles: Record<string, StyleRow> = {};
  setDefault(styleRow: StyleRow): void {
    this.defaultStyle = styleRow;
  }
  getDefault(): StyleRow {
    return this.defaultStyle;
  }
  setStyle(styleRow: StyleRow, geometryType: string): void {
    if (geometryType != null) {
      geometryType = geometryType.toUpperCase();
      if (styleRow != null) {
        this.styles[geometryType] = styleRow;
      } else {
        delete this.styles[geometryType];
      }
    } else {
      this.setDefault(styleRow);
    }
  }
  getStyle(geometryType: string): StyleRow {
    let styleRow = null;
    if (geometryType != null) {
      styleRow = this.styles[geometryType] || this.styles[geometryType.toUpperCase()];
    }
    if (styleRow === null || geometryType === null) {
      styleRow = this.getDefault();
    }
    return styleRow;
  }
  isEmpty(): boolean {
    return Object.keys(this.styles).length === 0 && this.defaultStyle === null;
  }
}
