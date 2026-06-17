import { Styles } from './styles';
import { Icons } from './icons';

/**
 * FeatureStyles constructor
 * @param {Styles} styles
 * @param {Icons} icons
 * @constructor
 */
export class FeatureStyles {
  constructor(public styles: Styles = null, public icons: Icons = null) {}

  public getStyles(): Styles {
    return this.styles;
  }

  public setStyles(styles: Styles): void {
    this.styles = styles;
  }

  public getIcons(): Icons {
    return this.icons;
  }

  public setIcons(icons: Icons): void {
    this.icons = icons;
  }
}
