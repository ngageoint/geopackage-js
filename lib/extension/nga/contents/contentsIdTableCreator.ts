import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import { GeoPackage } from '../../../geoPackage';
import { ContentsIdExtension } from './contentsIdExtension';

/**
 * Contents Id Extension Table Creator
 */
export class ContentsIdTableCreator extends GeoPackageTableCreator {
  /**
   * Constructor
   *
   * @param geoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * {@inheritDoc}
   */
  public getAuthor(): string {
    return ContentsIdExtension.EXTENSION_AUTHOR;
  }

  /**
   * {@inheritDoc}
   */
  public getName(): string {
    return ContentsIdExtension.EXTENSION_NAME_NO_AUTHOR;
  }

  /**
   * Create Contents Id table
   * @return executed statements
   */
  public createContentsId(): boolean {
    return this.execScript('contents_id');
  }
}
