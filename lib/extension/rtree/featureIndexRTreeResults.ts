import { FeatureIndexResults } from '../../features/index/featureIndexResults';
import { RTreeIndexTableDao } from './rTreeIndexTableDao';
import { UserCustomResultSet } from '../../user/custom/userCustomResultSet';
import { FeatureRow } from '../../features/user/featureRow';

/**
 * Iterable Feature Index Results to iterate on feature rows retrieved from
 * RTree results
 */
export class FeatureIndexRTreeResults implements FeatureIndexResults {
  /**
   * RTree Index Table DAO
   */
  private readonly dao: RTreeIndexTableDao;

  /**
   * Result Set
   */
  private readonly resultSet: UserCustomResultSet;

  /**
   * Constructor
   * @param dao RTree Index Table DAO
   * @param resultSet result set
   */
  public constructor(dao: RTreeIndexTableDao, resultSet: UserCustomResultSet) {
    this.dao = dao;
    this.resultSet = resultSet;
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
    const { value, done } = this.resultSet.next();
    const featureRow = this.dao.getFeatureRowWithUserCustomRow(value);
    return { value: featureRow, done };
  }

  public count(): number {
    return this.resultSet.getCount();
  }

  /**
   * {@inheritDoc}
   */
  public ids(): IterableIterator<number> {
    const dao = this.dao;
    return {
      [Symbol.iterator](): IterableIterator<number> {
        return this;
      },
      next(): IteratorResult<number> {
        const { value, done } = this.resultSet.next();
        return {
          value: dao.getRow(value).getId(),
          done: done,
        };
      },
    };
  }

  /**
   * {@inheritDoc}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public close(): void {}
}
