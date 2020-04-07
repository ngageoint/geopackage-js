import { Styles } from './styles';
import { Icons } from './icons';
/**
 * FeatureStyles constructor
 * @param {module:extension/style.Styles} styles
 * @param {module:extension/style.Icons} icons
 * @constructor
 */
export class FeatureStyles {
  constructor(public styles: Styles = null, public icons: Icons = null) {}
}
