import { IconRow } from './iconRow';
import { GeometryType } from '@ngageoint/simple-features-js';

/**
 * @class Icons
 */
export class Icons {
  defaultIcon: IconRow = null;
  icons: Map<GeometryType, IconRow>;
  tableIcons: boolean;

  /**
   * Icons constructor
   * @constructor
   */
  constructor(tableIcons = false) {
    this.icons = new Map();
    this.tableIcons = tableIcons;
  }

  setDefault(iconRow: IconRow): void {
    if (iconRow !== null && iconRow !== undefined) {
      iconRow.setTableIcon(this.tableIcons);
    }
    this.defaultIcon = iconRow;
  }
  getDefault(): IconRow {
    return this.defaultIcon;
  }
  setIcon(iconRow: IconRow, geometryType: GeometryType = null): void {
    if (geometryType !== null) {
      if (iconRow !== null && iconRow !== undefined) {
        iconRow.setTableIcon(this.tableIcons);
        this.icons.set(geometryType, iconRow);
      } else {
        this.icons.delete(geometryType);
      }
    } else {
      this.setDefault(iconRow);
    }
  }
  getIcon(geometryType: GeometryType = null): IconRow {
    let iconRow = null;
    if (geometryType !== null && this.icons.has(geometryType)) {
      iconRow = this.icons.get(geometryType);
    }
    if (iconRow === null || iconRow === undefined || geometryType === null) {
      iconRow = this.getDefault();
    }
    return iconRow;
  }
  isEmpty(): boolean {
    return this.icons.size === 0 && this.defaultIcon === null;
  }
  getGeometryTypes(): GeometryType[] {
    return Array.from(this.icons.keys());
  }
}
