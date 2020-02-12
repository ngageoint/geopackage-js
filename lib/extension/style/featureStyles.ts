import { Styles } from './styles';
import { Icons } from './icons';

/**
 * @memberOf module:extension/style
 * @class FeatureStyles
 */
/**
 * FeatureStyles constructor
 * @param {module:extension/style.Styles} styles
 * @param {module:extension/style.Icons} icons
 * @constructor
 */
export class FeatureStyles {
  constructor(public styles: Styles = null, public icons = null) {}
  /**
   * Set style
   * @param {module:extension/style.Styles} styles
   */
  setStyles(styles: Styles): void {
    this.styles = styles;
  }
  /**
   * Get style
   * @returns {module:extension/style.Styles}
   */
  getStyles(): Styles {
    return this.styles;
  }
  /**
   * Set icon
   * @param {module:extension/style.Icons} icons
   */
  setIcons(icons: Icons): void {
    this.icons = icons;
  }
  /**
   * Get icon
   * @returns {module:extension/style.Icons}
   */
  getIcons(): Icons {
    return this.icons;
  }
}
