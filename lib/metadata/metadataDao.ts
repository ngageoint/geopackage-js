/**
 * Metadata module.
 * @module metadata
 * @see module:dao/dao
 */
import {Dao} from '../dao/dao';

import { Metadata } from './metadata';

/**
 * Metadata Data Access Object
 * @class
 * @extends Dao
 */
export class MetadataDao extends Dao<Metadata> {
  public static readonly TABLE_NAME: string = "gpkg_metadata";
  public static readonly COLUMN_ID: string = "id";
  public static readonly COLUMN_MD_SCOPE: string = "md_scope";
  public static readonly COLUMN_MD_STANDARD_URI: string = "md_standard_uri";
  public static readonly COLUMN_MIME_TYPE: string = "mime_type";
  public static readonly COLUMN_METADATA: string = "metadata";

  readonly gpkgTableName: string = MetadataDao.TABLE_NAME;
  readonly idColumns: string[] = [MetadataDao.COLUMN_ID];

  createObject(): Metadata {
    return new Metadata();
  }
}