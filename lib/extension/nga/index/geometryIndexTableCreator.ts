import { GeoPackageTableCreator } from '../../../db/geoPackageTableCreator';
import { GeoPackage } from '../../../geoPackage';
import { FeatureTableIndex } from './featureTableIndex';

/**
 * Geometry Index Extension Table Creator
 */
export class GeometryIndexTableCreator extends GeoPackageTableCreator {
  /**
   * Table Index property
   */
  public static readonly TABLE_INDEX = 'table_index';

  /**
   * Geometry Index property
   */
  public static readonly GEOMETRY_INDEX = 'geometry_index';

  /**
   * Index Geometry Index property
   */
  public static readonly INDEX_GEOMETRY_INDEX = 'geometry_index_index';

  /**
   * Unindex Geometry Index property
   */
  public static readonly UNINDEX_GEOMETRY_INDEX = 'geometry_index_unindex';

  /**
   * Constructor
   *
   * @param geoPackage GeoPackage
   */
  public constructor(geoPackage: GeoPackage) {
    super(geoPackage);
  }

  /**
   * {@inheritDoc}
   */
  public getAuthor(): string {
    return FeatureTableIndex.EXTENSION_AUTHOR;
  }

  /**
   * {@inheritDoc}
   */
  public getName(): string {
    return FeatureTableIndex.EXTENSION_NAME_NO_AUTHOR;
  }

  /**
   * Create Table Index table
   *
   * @return executed statements
   */
  public createTableIndex(): boolean {
    return this.execScript(GeometryIndexTableCreator.TABLE_INDEX);
  }

  /**
   * Create Geometry Index table
   *
   * @return executed statements
   */
  public createGeometryIndex(): boolean {
    return this.execScript(GeometryIndexTableCreator.GEOMETRY_INDEX) && this.indexGeometryIndex();
  }

  /**
   * Create Geometry Index table column indexes
   *
   * @return executed statements
   */
  public indexGeometryIndex(): boolean {
    return this.execScript(GeometryIndexTableCreator.INDEX_GEOMETRY_INDEX);
  }

  /**
   * Un-index (drop) Geometry Index table column indexes
   * @return executed statements
   */
  public unindexGeometryIndex(): boolean {
    return this.execScript(GeometryIndexTableCreator.UNINDEX_GEOMETRY_INDEX);
  }
}
