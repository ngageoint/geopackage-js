import { NGAExtensionsConstants } from '../ngaExtensionsConstants';
import { Extensions } from '../../extensions';
import { FeatureTileLinkDao } from './featureTileLinkDao';
import { FeatureTileLink } from './featureTileLink';
import { BaseExtension } from '../../baseExtension';
import { GeoPackageException } from '../../../geoPackageException';
import { FeatureTileLinkKey } from './featureTileLinkKey';
import { ExtensionScopeType } from '../../extensionScopeType';
import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import type { GeoPackage } from '../../../geoPackage';

/**
 * Abstract Feature Tile Table linker, used to link feature and tile tables
 * together when the tiles represent the feature data
 */
export class FeatureTileTableLinker extends BaseExtension {
  /**
   * Extension author
   */
  public static readonly EXTENSION_AUTHOR: string = NGAExtensionsConstants.EXTENSION_AUTHOR;

  /**
   * Extension name without the author
   */
  public static readonly EXTENSION_NAME_NO_AUTHOR: string = 'feature_tile_link';

  /**
   * Extension, with author and name
   */
  public static readonly EXTENSION_NAME: string = Extensions.buildExtensionName(
    FeatureTileTableLinker.EXTENSION_AUTHOR,
    FeatureTileTableLinker.EXTENSION_NAME_NO_AUTHOR,
  );

  /**
   * Extension definition URL
   */
  public static readonly EXTENSION_DEFINITION: string =
    'http://ngageoint.github.io/GeoPackage/docs/extensions/feature-tile-link.html';

  /**
   * Feature Tile Link DAO
   */
  private readonly featureTileLinkDao: FeatureTileLinkDao;

  /**
   * Constructor
   * @param geoPackage GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
    this.featureTileLinkDao = FeatureTileLinkDao.createDao(geoPackage);
  }

  /**
   * Get the GeoPackage
   * @return GeoPackage
   */
  public getGeoPackage(): GeoPackage {
    return this.geoPackage;
  }

  /**
   * Get the feature tile link DAO
   *
   * @return dao
   */
  public getDao(): FeatureTileLinkDao {
    return this.featureTileLinkDao;
  }

  /**
   * Link a feature and tile table together. Does nothing if already linked.
   *
   * @param featureTable  feature table
   * @param tileTable tile table
   */
  public link(featureTable: string, tileTable: string): void {
    if (!this.isLinked(featureTable, tileTable)) {
      this.getOrCreateExtension();

      try {
        if (!this.featureTileLinkDao.isTableExists()) {
          this.createFeatureTileLinkTable();
        }

        const link = new FeatureTileLink();
        link.setFeatureTableName(featureTable);
        link.setTileTableName(tileTable);

        this.featureTileLinkDao.create(link);
      } catch (e) {
        throw new GeoPackageException(
          'Failed to create feature tile link for GeoPackage: ' +
            this.geoPackage.getName() +
            ', Feature Table: ' +
            featureTable +
            ', Tile Table: ' +
            tileTable,
        );
      }
    }
  }

  /**
   * Determine if the feature table is linked to the tile table
   * @param featureTable feature table
   * @param tileTable tile table
   * @return true if linked
   */
  public isLinked(featureTable: string, tileTable: string): boolean {
    return this.getLink(featureTable, tileTable) != null;
  }

  /**
   * Get the feature and tile table link if it exists
   *
   * @param featureTable
   *            feature table
   * @param tileTable
   *            tile table
   * @return link or null
   */
  public getLink(featureTable: string, tileTable: string): FeatureTileLink {
    let link = null;
    if (this.featureTileLinksActive()) {
      const id = new FeatureTileLinkKey(featureTable, tileTable);
      try {
        link = this.featureTileLinkDao.queryForFeatureTileLinkKey(id);
      } catch (e) {
        throw new GeoPackageException(
          'Failed to get feature tile link for GeoPackage: ' +
            this.geoPackage.getName() +
            ', Feature Table: ' +
            featureTable +
            ', Tile Table: ' +
            tileTable,
        );
      }
    }
    return link;
  }

  /**
   * Query for feature tile links by feature table
   * @param featureTable feature table
   * @return links
   */
  public queryForFeatureTable(featureTable: string): FeatureTileLink[] {
    let links: FeatureTileLink[] = [];
    if (this.featureTileLinksActive()) {
      links = this.featureTileLinkDao.queryForFeatureTableName(featureTable);
    }
    return links;
  }

  /**
   * Query for feature tile links by tile table
   *
   * @param tileTable
   *            tile table
   * @return links
   */
  public queryForTileTable(tileTable: string): FeatureTileLink[] {
    let links: FeatureTileLink[] = [];

    if (this.featureTileLinksActive()) {
      links = this.featureTileLinkDao.queryForTileTableName(tileTable);
    }

    return links;
  }

  /**
   * Delete the feature tile table link
   *
   * @param featureTable
   *            feature table
   * @param tileTable
   *            tile table
   * @return true if deleted
   */
  public deleteLink(featureTable: string, tileTable: string): boolean {
    let deleted = false;
    try {
      if (this.featureTileLinkDao.isTableExists()) {
        const id = new FeatureTileLinkKey(featureTable, tileTable);
        deleted = this.featureTileLinkDao.deleteByFeatureTileLinkKey(id) > 0;
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete feature tile link for GeoPackage: ' +
          this.geoPackage.getName() +
          ', Feature Table: ' +
          featureTable +
          ', Tile Table: ' +
          tileTable,
      );
    }
    return deleted;
  }

  /**
   * Delete the feature tile table links for the feature or tile table
   *
   * @param table table name
   * @return links deleted
   */
  public deleteLinks(table: string): number {
    let deleted = 0;
    try {
      if (this.featureTileLinkDao.isTableExists()) {
        deleted = this.featureTileLinkDao.deleteByTableName(table);
      }
    } catch (e) {
      throw new GeoPackageException(
        'Failed to delete feature tile links for GeoPackage: ' + this.geoPackage.getName() + ', Table: ' + table,
      );
    }
    return deleted;
  }

  /**
   * Get or create if needed the extension
   *
   * @return extensions object
   */
  private getOrCreateExtension(): Extensions {
    return this.getOrCreate(
      FeatureTileTableLinker.EXTENSION_NAME,
      null,
      null,
      FeatureTileTableLinker.EXTENSION_DEFINITION,
      ExtensionScopeType.READ_WRITE,
    );
  }

  /**
   * Check if has extension
   *
   * @return true if has extension
   */
  public has(): boolean {
    const extensions = this.getExtension(FeatureTileTableLinker.EXTENSION_NAME, null, null);
    return extensions != null && extensions.length > 0;
  }

  /**
   * Create the Feature Tile Link Table if it does not exist
   * @return true if created
   */
  public createFeatureTileLinkTable(): boolean {
    this.verifyWritable();

    let created = false;

    try {
      if (!this.featureTileLinkDao.isTableExists()) {
        const tableCreator = new GeoPackageTableCreator(this.geoPackage);
        created = tableCreator.execScript('feature_tile_link');
      }
    } catch (e) {
      throw new GeoPackageException('Failed to check if FeatureTileLink table exists and create it');
    }
    return created;
  }

  /**
   * Determine if the feature tile link extension and table exists
   * @return
   */
  private featureTileLinksActive(): boolean {
    let active = false;
    if (this.has()) {
      try {
        active = this.featureTileLinkDao.isTableExists();
      } catch (e) {
        throw new GeoPackageException(
          'Failed to check if the feature tile link table exists for GeoPackage: ' + this.geoPackage.getName(),
        );
      }
    }

    return active;
  }

  /**
   * Query for the tile table names linked to a feature table
   * @param featureTable feature table
   * @return tiles tables
   */
  public getTileTablesForFeatureTable(featureTable: string): string[] {
    const tileTables = [];
    const links = this.queryForFeatureTable(featureTable);
    for (const link of links) {
      tileTables.push(link.getTileTableName());
    }
    return tileTables;
  }

  /**
   * Query for the feature table names linked to a tile table
   *
   * @param tileTable
   *            tile table
   * @return feature tables
   */
  public getFeatureTablesForTileTable(tileTable: string): string[] {
    const featureTables = [];

    const links = this.queryForTileTable(tileTable);
    for (const link of links) {
      featureTables.push(link.getFeatureTableName());
    }

    return featureTables;
  }

  /**
   * Creates a Feature Tile Link Dao
   * @param geoPackage
   */
  static getFeatureTileLinkDao(geoPackage: GeoPackage): FeatureTileLinkDao {
    return FeatureTileLinkDao.createDao(geoPackage);
  }
}
