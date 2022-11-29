import { Extensions } from '../extensions';
import { GeoPackageConstants } from '../../geoPackageConstants';

/**
 * RTreeIndex extension
 */
export class RTreeIndexExtensionConstants {
  /**
   * Name
   */
  public static readonly NAME = 'rtree_index';

  /**
   * RTree table and trigger name prefix
   */
  public static readonly RTREE_PREFIX = 'rtree_';

  /**
   * Min X Function name
   */
  public static readonly MIN_X_FUNCTION = 'ST_MinX';

  /**
   * Max X Function name
   */
  public static readonly MAX_X_FUNCTION = 'ST_MaxX';

  /**
   * Min Y Function name
   */
  public static readonly MIN_Y_FUNCTION = 'ST_MinY';

  /**
   * Max Y Function name
   */
  public static readonly MAX_Y_FUNCTION = 'ST_MaxY';

  /**
   * Is Empty Function name
   */
  public static readonly IS_EMPTY_FUNCTION = 'ST_IsEmpty';

  /**
   * Create SQL property
   */
  public static readonly CREATE_PROPERTY = 'create';

  /**
   * Table SQL property
   *
   */
  public static readonly TABLE_PROPERTY = 'table';

  /**
   * Load SQL property
   */
  public static readonly LOAD_PROPERTY = 'load';

  /**
   * Drop SQL property
   */
  public static readonly DROP_PROPERTY = 'drop';

  /**
   * Drop Force SQL property
   *
   */
  public static readonly DROP_FORCE_PROPERTY = 'drop_force';

  /**
   * Trigger Insert name
   */
  public static readonly TRIGGER_INSERT_NAME = 'insert';

  /**
   * Trigger update 1 name
   */
  public static readonly TRIGGER_UPDATE1_NAME = 'update1';

  /**
   * Trigger update 2 name
   */
  public static readonly TRIGGER_UPDATE2_NAME = 'update2';

  /**
   * Trigger update 3 name
   */
  public static readonly TRIGGER_UPDATE3_NAME = 'update3';

  /**
   * Trigger update 4 name
   */
  public static readonly TRIGGER_UPDATE4_NAME = 'update4';

  /**
   * Trigger delete name
   */
  public static readonly TRIGGER_DELETE_NAME = 'delete';

  /**
   * Trigger drop name
   */
  public static readonly TRIGGER_DROP_PROPERTY = 'drop';

  /**
   * ID column name
   *
   */
  public static readonly COLUMN_ID = 'id';

  /**
   * Min X column name
   *
   */
  public static readonly COLUMN_MIN_X = 'minx';

  /**
   * Max X column name
   *
   */
  public static readonly COLUMN_MAX_X = 'maxx';

  /**
   * Min Y column name
   *
   */
  public static readonly COLUMN_MIN_Y = 'miny';

  /**
   * Max Y column name
   *
   */
  public static readonly COLUMN_MAX_Y = 'maxy';

  /**
   * Table substitute value
   */
  public static readonly TABLE_SUBSTITUTE = '<t>';

  /**
   * Geometry Column substitute value
   */
  public static readonly GEOMETRY_COLUMN_SUBSTITUTE = '<c>';

  /**
   * Primary Key Column substitute value
   */
  public static readonly PK_COLUMN_SUBSTITUTE = '<i>';

  /**
   * Trigger substitute value
   */
  public static readonly TRIGGER_SUBSTITUTE = '<n>';
}
