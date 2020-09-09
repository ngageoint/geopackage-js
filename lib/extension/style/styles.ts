import { StyleRow } from './styleRow';
import { GeometryType } from '../../features/user/geometryType';

/**
 * Styles constructor
 * @constructor
 */
export class Styles {
  defaultStyle: StyleRow = null;
  // @ts-ignore
  styles: Map<GeometryType, StyleRow>;
  tableStyles: boolean;

  constructor(tableStyles: boolean = false) {
    this.styles = new Map();
    this.tableStyles = tableStyles;
  }

  setDefault(styleRow: StyleRow): void {
    if (styleRow !== null && styleRow !== undefined) {
      styleRow.setTableStyle(this.tableStyles);
    }
    this.defaultStyle = styleRow;
  }
  getDefault(): StyleRow {
    return this.defaultStyle;
  }
  setStyle(styleRow: StyleRow, geometryType: GeometryType = null): void {
    if (geometryType !== null) {
      if (styleRow !== null && styleRow !== undefined) {
        styleRow.setTableStyle(this.tableStyles);
        this.styles.set(geometryType, styleRow);
      } else {
        this.styles.delete(geometryType);
      }
    } else {
      this.setDefault(styleRow);
    }
  }
  getStyle(geometryType: GeometryType = null): StyleRow {
    let styleRow = null;
    if (geometryType !== null) {
      styleRow = this.styles.get(geometryType);
    }
    if (styleRow === null || styleRow === undefined || geometryType === null) {
      styleRow = this.getDefault();
    }
    return styleRow;
  }
  isEmpty(): boolean {
    return this.styles.size === 0 && this.defaultStyle === null;
  }
  getGeometryTypes(): GeometryType[] {
    return Array.from(this.styles.keys());
  }
}
