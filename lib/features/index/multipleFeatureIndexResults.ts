import { FeatureIndexResults } from './featureIndexResults';
import { FeatureRow } from '../user/featureRow';

/**
 * Iterable Feature Index Results to iterate on feature rows from a combination
 * of multiple Feature Index Results
 */
export class MultipleFeatureIndexResults implements FeatureIndexResults {
  /**
   * List of multiple Feature Index Results
   */
  private readonly results: FeatureIndexResults[] = [];

  /**
   * Total feature row result count
   */
  private readonly _count: number;

  /**
   * Private index for the result set
   * @private
   */
  private resultSetIdx = -1;

  /**
   * private result set holder
   * @private
   */
  private currentResultSet = null;

  /**
   * private ids result set holder
   * @private
   */
  private currentIdsResultSet = null;

  /**
   * Constructor
   * @param results multiple results
   */
  public constructor(results: FeatureIndexResults[]) {
    this.results.push(...results);
    let totalCount = 0;
    for (const result of results) {
      totalCount += result.count();
    }
    this._count = totalCount;
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
        if (this.currentIdResultSet == null && this.resultSetIdx + 1 < this.results.length) {
          this.currentIdResultSet = this.results[++this.resultSetIdx].ids();
        }
        const result = this.currentIdResultSet.next();
        if (result.done) {
          this.currentIdResultSet = null;
          if (this.currentIdResultSet == null && this.resultSetIdx + 1 < this.results.length) {
            this.currentIdResultSet = this.results[++this.resultSetIdx];
          }
        }
        result.done = this.currentIdResultSet != null;
        return result;
      },
    };
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
    if (this.currentResultSet == null && this.resultSetIdx + 1 < this.results.length) {
      this.currentResultSet = this.results[++this.resultSetIdx];
    }
    const result = this.currentResultSet.next();
    if (result.done) {
      this.currentResultSet = null;
      if (this.currentResultSet == null && this.resultSetIdx + 1 < this.results.length) {
        this.currentResultSet = this.results[++this.resultSetIdx];
      }
    }
    result.done = this.currentResultSet != null;
    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  close(): void {}
}
