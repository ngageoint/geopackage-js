import { IconRow } from './iconRow';

/**
 * @memberOf module:extension/style
 * @class Icons
 */
/**
 * Icons constructor
 * @constructor
 */
export class Icons {
  defaultIcon: IconRow = null;
  icons: Record<string, IconRow> = {};
  setDefault(iconRow: IconRow): void {
    this.defaultIcon = iconRow;
  }
  getDefault(): IconRow {
    return this.defaultIcon;
  }
  setIcon(iconRow: IconRow, geometryType: string): void {
    if (geometryType != null) {
      if (iconRow != null) {
        this.icons[geometryType] = iconRow;
      } else {
        delete this.icons[geometryType];
      }
    } else {
      this.setDefault(iconRow);
    }
  }
  getIcon(geometryType: string): IconRow {
    let iconRow = null;
    if (geometryType != null) {
      iconRow = this.icons[geometryType] || this.icons[geometryType.toUpperCase()];
    }
    if (iconRow === null || geometryType === null) {
      iconRow = this.getDefault();
    }
    return iconRow;
  }
  isEmpty(): boolean {
    return Object.keys(this.icons).length === 0 && this.defaultIcon === null;
  }
}
