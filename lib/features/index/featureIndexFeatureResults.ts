import { FeatureIndexResults } from './featureIndexResults';
import { FeatureResultSet } from '../user/featureResultSet';
import { FeatureRow } from '../user/featureRow';

/**
 * Iterable Feature Index Results to iterate on feature results from a feature DAO
 */
export class FeatureIndexFeatureResults implements FeatureIndexResults {
  /**
   * Result Set
   */
  private readonly resultSet: FeatureResultSet;

  /**
   * Constructor
   * @param resultSet result set
   */
  public constructor(resultSet: FeatureResultSet) {
    this.resultSet = resultSet;
  }

  /**
   * Get the result set
   * @return feature result set
   */
  public getResultSet(): FeatureResultSet {
    return this.resultSet;
  }

  /**
   * {@inheritDoc}
   */
  public count(): number {
    return this.resultSet.getCount();
  }

  /**
   * {@inheritDoc}
   */
  public ids(): IterableIterator<number> {
    return this.resultSet.ids();
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
    const value = this.resultSet.getRow();
    if (this.resultSet.moveToNext()) {
      return {
        value: value,
        done: false,
      };
    } else {
      return {
        value: value,
        done: true,
      };
    }
  }
}
