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
    this.type = this.getNextSupportedFeatureIndexType();
  }

  [Symbol.iterator](): IterableIterator<FeatureIndexType> {
    return this;
  }

  private getNextSupportedFeatureIndexType(): FeatureIndexType {
    let next = this.order.next();
    let type = null;
    while (!next.done) {
      if (this.manager.isIndexedForType(next.value)) {
        type = next.value;
        break;
      }
      next = this.order.next();
    }
    return type;
  }

  public next(): { value: FeatureIndexType, done: boolean } {
    const currentType = this.type;
    this.type = this.getNextSupportedFeatureIndexType();

    return {
      value: currentType,
      done: currentType == null
    };
  }
}
