import { FeatureTileLink } from './featureTileLink';
import { FeatureTileLinkKey } from './featureTileLinkKey';
import { ColumnValues } from '../../../dao/columnValues';
import { GeoPackageException } from '../../../geoPackageException';
import { DBValue } from '../../../db/dbValue';
import { GeoPackageDao } from '../../../db/geoPackageDao';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Feature Tile Link Data Access Object
 */
export class FeatureTileLinkDao extends GeoPackageDao<FeatureTileLink, FeatureTileLinkKey> {
  /**
   * Constructor
   * @param geoPackage GeoPackage object this dao belongs to
   */
  constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * Create the dao
   * @param geoPackage
   */
  public static createDao(geoPackage: GeoPackage): FeatureTileLinkDao {
    return new FeatureTileLinkDao(geoPackage);
  }

  /**
   * Create a {module:extension/nga/contents.ContentsId} object
   * @return {module:extension/nga/contents.ContentsId}
   */
  createObject(results?: Record<string, DBValue>): FeatureTileLink {
    const c = new FeatureTileLink();
    if (results) {
      c.setFeatureTableName(results.feature_table_name as string);
      c.setTileTableName(results.tile_table_name as string);
    }
    return c;
  }

  /**
   * {@inheritDoc}
   */
  public queryForFeatureTileLinkKey(key: FeatureTileLinkKey): FeatureTileLink {
    let featureTileLink = null;
    if (key != null) {
      const fieldValues = new ColumnValues();
      fieldValues.addColumn(FeatureTileLink.COLUMN_FEATURE_TABLE_NAME, key.getFeatureTableName());
      fieldValues.addColumn(FeatureTileLink.COLUMN_TILE_TABLE_NAME, key.getTileTableName());
      const results = [];
      for (const result of this.queryForFieldValues(fieldValues)) {
        results.push(this.createObject(result));
      }
      if (results.length > 0) {
        if (results.length > 1) {
          throw new Error(
            'More than one FeatureTileLink' +
              ' returned for key. Feature Table Name: ' +
              key.getFeatureTableName() +
              ', Tile Table Name: ' +
              key.getTileTableName(),
          );
        }
        featureTileLink = results[0];
      }
    }
    return featureTileLink;
  }

  /**
   * {@inheritDoc}
   */
  public extractId(data: FeatureTileLink): FeatureTileLinkKey {
    return data.getId();
  }

  /**
   * {@inheritDoc}
   */
  public idExists(id: FeatureTileLinkKey): boolean {
    return this.queryForFeatureTileLinkKey(id) != null;
  }

  /**
   * {@inheritDoc}
   */
  public queryForSameId(data: FeatureTileLink): FeatureTileLink {
    return this.queryForFeatureTileLinkKey(data.getId());
  }

  /**
   * {@inheritDoc}
   */
  public updateId(data: FeatureTileLink, newId: FeatureTileLinkKey): number {
    let count = 0;
    const readData = this.queryForFeatureTileLinkKey(data.getId());
    if (readData != null && newId != null) {
      readData.setId(newId);
      count = this.update(readData).changes;
    }
    return count;
  }

  /**
   * {@inheritDoc}
   */
  public deleteByFeatureTileLink(data: FeatureTileLink): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(FeatureTileLink.COLUMN_FEATURE_TABLE_NAME, data.getFeatureTableName());
    where += ' and ';
    where += this.buildWhereWithFieldAndValue(FeatureTileLink.COLUMN_TILE_TABLE_NAME, data.getTileTableName());
    const whereArgs = this.buildWhereArgs([data.getFeatureTableName(), data.getTileTableName()]);
    return this.deleteWhere(where, whereArgs);
  }

  /**
   * {@inheritDoc}
   */
  public deleteByFeatureTileLinkKey(id: FeatureTileLinkKey): number {
    let count = 0;
    if (id != null) {
      const deleteData = this.queryForFeatureTileLinkKey(id);
      if (deleteData != null) {
        count = this.deleteByFeatureTileLink(deleteData);
      }
    }
    return count;
  }

  /**
   * {@inheritDoc}
   */
  public deleteByFeatureTileLinkKeys(idCollection: FeatureTileLinkKey[]): number {
    let count = 0;
    if (idCollection != null) {
      for (const id of idCollection) {
        count += this.deleteByFeatureTileLinkKey(id);
      }
    }
    return count;
  }

  /**
   * Query by feature table name
   * @param featureTableName feature table name
   * @return feature tile links
   */
  public queryForFeatureTableName(featureTableName: string): FeatureTileLink[] {
    let results = null;
    try {
      results = this.queryForAllEq(FeatureTileLink.COLUMN_FEATURE_TABLE_NAME, featureTableName);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for Feature Tile Link objects by Feature Table Name: ' + featureTableName,
      );
    }
    return results;
  }

  /**
   * Query by tile table name
   *
   * @param tileTableName tile table name
   * @return feature tile links
   */
  public queryForTileTableName(tileTableName: string): FeatureTileLink[] {
    let results = null;
    try {
      results = this.queryForAllEq(FeatureTileLink.COLUMN_TILE_TABLE_NAME, tileTableName);
    } catch (e) {
      throw new GeoPackageException(
        'Failed to query for Feature Tile Link objects by Tile Table Name: ' + tileTableName,
      );
    }
    return results;
  }

  /**
   * Delete by table name, either feature or tile table name
   * @param tableName table name, feature or tile
   * @return rows deleted
   */
  public deleteByTableName(tableName: string): number {
    let where = '';
    where += this.buildWhereWithFieldAndValue(FeatureTileLink.COLUMN_FEATURE_TABLE_NAME, tableName);
    where += ' or ';
    where += this.buildWhereWithFieldAndValue(FeatureTileLink.COLUMN_TILE_TABLE_NAME, tableName);
    const whereArgs = this.buildWhereArgs([tableName, tableName]);
    return this.deleteWhere(where, whereArgs);
  }

  queryForIdWithKey(key: FeatureTileLinkKey): FeatureTileLink {
    return this.queryForMultiId([key.getTileTableName(), key.getFeatureTableName()]);
  }
}
