import { NGAExtensionsConstants } from '../ngaExtensionsConstants';
import { Extensions } from '../../extensions';

/**
 * Feature Table Index Constants
 */
export class FeatureTableIndexConstants {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR = NGAExtensionsConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR = 'geometry_index';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME = Extensions.buildExtensionName(
    FeatureTableIndexConstants.EXTENSION_AUTHOR,
    FeatureTableIndexConstants.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/geometry-index.html';
}
