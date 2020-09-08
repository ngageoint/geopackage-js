import { IconRow } from './iconRow';
import { GeometryType } from '../../features/user/geometryType';

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
  icons: Map<GeometryType, IconRow>;

  constructor() {
    this.icons = new Map();
  }

  setDefault(iconRow: IconRow): void {
    this.defaultIcon = iconRow;
  }
  getDefault(): IconRow {
    return this.defaultIcon;
  }
  setIcon(iconRow: IconRow, geometryType: GeometryType = null): void {
    if (geometryType !== null) {
      if (iconRow !== null && iconRow !== undefined) {
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
