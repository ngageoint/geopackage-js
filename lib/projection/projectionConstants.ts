/**
 * projectionConstants module.
 * @module projection/projectionConstants
 */

export class ProjectionConstants {
  public static readonly EPSG: string = 'EPSG';
  public static readonly EPSG_PREFIX: string = 'EPSG:';
  public static readonly EPSG_CODE_3857: number = 3857;
  public static readonly EPSG_CODE_4326: number = 4326;
  public static readonly EPSG_CODE_900913: number = 900913;
  public static readonly EPSG_CODE_102113: number = 102113;
  public static readonly EPSG_3857: string = ProjectionConstants.EPSG_PREFIX + ProjectionConstants.EPSG_CODE_3857;
  public static readonly EPSG_4326: string = ProjectionConstants.EPSG_PREFIX + ProjectionConstants.EPSG_CODE_4326;
  public static readonly EPSG_900913: string = ProjectionConstants.EPSG_PREFIX + ProjectionConstants.EPSG_CODE_900913;
  public static readonly EPSG_102113: string = ProjectionConstants.EPSG_PREFIX + ProjectionConstants.EPSG_CODE_102113;
  public static readonly WEB_MERCATOR_MAX_LAT_RANGE: number = 85.0511287798066;
  public static readonly WEB_MERCATOR_MIN_LAT_RANGE: number = -85.05112877980659;
  public static readonly WEB_MERCATOR_MAX_LON_RANGE: number = 180.0;
  public static readonly WEB_MERCATOR_MIN_LON_RANGE: number = -180.0;
  public static readonly WEB_MERCATOR_HALF_WORLD_WIDTH: number = 20037508.342789244;

}
