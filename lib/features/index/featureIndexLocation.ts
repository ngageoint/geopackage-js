import { FeatureIndexType } from './featureIndexType';
import type { FeatureIndexManager } from './featureIndexManager';

/**
 * Feature Index Location to iterate over indexed feature index types
 */
export class FeatureIndexLocation implements IterableIterator<FeatureIndexType> {
  /**
   * Feature Index Manager
   */
  private readonly manager: FeatureIndexManager;

  /**
   * Feature index type query order
   */
  private order;

  /**
   * Current feature index type
   */
  private type: FeatureIndexType;

  /**
   * Constructor
   * @param manager  feature index manager
   */
  public constructor(manager: FeatureIndexManager) {
    this.manager = manager;
    this.order = this.manager.getIndexLocationQueryOrder()[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<FeatureIndexType> {
    return this;
  }

  public next(): { done: boolean; value: FeatureIndexType } {
    const nextType = this.type;
    this.type = null;
    const next = this.order.next();
    if (next != null && next.value != null && this.manager.isIndexedForType(next.value)) {
      this.type = next.value;
    }
    return { value: nextType, done: this.type != null };
  }
}
