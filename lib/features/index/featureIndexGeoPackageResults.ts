import { FeatureIndexResults } from './featureIndexResults';
import { FeatureTableIndex } from '../../extension/nga/index/featureTableIndex';
import { GeometryIndex } from '../../extension/nga/index/geometryIndex';
import { FeatureRow } from '../user/featureRow';

/**
 * Iterable Feature Index Results to iterate on feature rows retrieved from
 * GeoPackage index extension results
 */
export class FeatureIndexGeoPackageResults implements FeatureIndexResults {
  /**
   * Feature Table Index, for indexing within a GeoPackage extension
   */
  private readonly featureTableIndex: FeatureTableIndex;

  /**
   * Total count of the results
   */
  private readonly _count: number;

  /**
   * Iterator of Geometry Index results
   */
  private readonly geometryIndices: IterableIterator<GeometryIndex>;

  /**
   * Constructor
   *
   * @param featureTableIndex feature table index
   * @param count count
   * @param geometryIndices geometry indices
   */
  public constructor(
    featureTableIndex: FeatureTableIndex,
    count: number,
    geometryIndices: IterableIterator<GeometryIndex>,
  ) {
    this.featureTableIndex = featureTableIndex;
    this._count = count;
    this.geometryIndices = geometryIndices;
  }

  /**
   * {@inheritDoc}
   */
  [Symbol.iterator](): IterableIterator<FeatureRow> {
    return this;
  }

  /**
   * {@inheritDoc}
   */
  public next(): { value: FeatureRow; done: boolean } {
    const { value, done } = this.geometryIndices.next();
    const featureRow = this.featureTableIndex.getFeatureRow(value);
    return { value: featureRow, done };
  }
  /**
   * {@inheritDoc}
   */
  public count(): number {
    return this._count;
  }

  /**
   * {@inheritDoc}
   */
  public ids(): IterableIterator<number> {
    return {
      [Symbol.iterator](): IterableIterator<number> {
        return this;
      },
      next(): IteratorResult<number> {
        const result = this.geometryIndices.next();
        return {
          value: result.value.getId(),
          done: result.done,
        };
      },
    };
  }
}
