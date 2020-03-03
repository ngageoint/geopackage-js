/**
 * Metadata module.
 * @module metadata
 * @see module:dao/dao
 */
import { Dao } from '../dao/dao';

import { Metadata } from './metadata';
import { DBValue } from '../db/dbAdapter';

/**
 * Metadata Data Access Object
 * @class
 * @extends Dao
 */
export class MetadataDao extends Dao<Metadata> {
  public static readonly TABLE_NAME: string = 'gpkg_metadata';
  public static readonly COLUMN_ID: string = 'id';
  public static readonly COLUMN_MD_SCOPE: string = 'md_scope';
  public static readonly COLUMN_MD_STANDARD_URI: string = 'md_standard_uri';
  public static readonly COLUMN_MIME_TYPE: string = 'mime_type';
  public static readonly COLUMN_METADATA: string = 'metadata';

  readonly gpkgTableName: string = MetadataDao.TABLE_NAME;
  readonly idColumns: string[] = [MetadataDao.COLUMN_ID];

  createObject(results?: Record<string, DBValue>): Metadata {
    const m = new Metadata();
    if (results) {
      m.id = results.id as number;
      m.md_scope = results.md_scope as string;
      m.md_standard_uri = results.md_standard_uri as string;
      m.mime_type = results.mime_type as string;
      m.metadata = results.metadata as string;
    }
    return m;
  }
}
