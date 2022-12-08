import { FeatureIndexResults } from '../index/featureIndexResults';
import { FeatureDao } from './featureDao';
import { FeatureRow } from './featureRow';

/**
 * Manual Feature Query Results which includes the ids used to read each row
 */
export class ManualFeatureQueryResults implements FeatureIndexResults {
  /**
   * Feature DAO
   */
  private readonly featureDao: FeatureDao;

  /**
   * Feature columns
   */
  private readonly columns: string[];

  /**
   * Feature ids
   */
  private readonly featureIds: number[];

  /**
   * featureIds index
   * @private
   */
  private index = 0;

  /**
   * Constructor
   * @param featureDao feature DAO
   * @param featureIds feature ids
   * @param columns columns
   */
  public constructor(featureDao: FeatureDao, featureIds: number[], columns?: string[]) {
    this.featureDao = featureDao;
    this.columns = columns || featureDao.getColumnNames();
    this.featureIds = featureIds;
  }

  /**
   * Get the feature DAO
   *
   * @return feature DAO
   */
  public getFeatureDao(): FeatureDao {
    return this.featureDao;
  }

  /**
   * Get the feature columns
   * @return columns
   */
  public getColumns(): string[] {
    return this.columns;
  }

  /**
   * Get the feature ids
   *
   * @return feature ids
   */
  public getFeatureIds(): number[] {
    return this.featureIds;
  }

  [Symbol.iterator](): IterableIterator<FeatureRow> {
    return this;
  }

  public next(): { value: FeatureRow; done: boolean } {
    const id = this.featureIds[this.index++];
    const done = this.index >= this.featureIds.length;
    const value = this.featureDao.queryForId(id);
    return {
      value,
      done,
    };
  }

  /**
   * {@inheritDoc}
   */
  public count(): number {
    return this.featureIds.length;
  }

  /**
   * {@inheritDoc}
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public close(): void {}

  /**
   * {@inheritDoc}
   */
  public ids(): IterableIterator<number> {
    return this.featureIds[Symbol.iterator]();
  }
}
