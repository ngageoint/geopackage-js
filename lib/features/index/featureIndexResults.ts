import { FeatureRow } from '../user/featureRow';
/**
 * Iterable Feature Index Results to iterate on feature rows
 */
export interface FeatureIndexResults extends IterableIterator<FeatureRow> {
  /**
   * Get the count of results
   *
   * @return count
   */
  count(): number;

  /**
   * Iterable for iterating over feature ids in place of feature rows
   * @return iterable ids
   */
  ids(): IterableIterator<number>;

  /**
   * Close results
   */
  close(): void;
}
