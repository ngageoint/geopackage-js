/**
 * Content Values mapping between columns and values.
 */
export class ContentValues {
  /**
   * Mapping between columns and values
   */
  private values: Map<string, any> = new Map<string, any>();

  /**
   * Put a key value pair
   *
   * @param key key
   * @param value value
   */
  public put(key: string, value: any): void {
    this.values.set(key, value);
  }

  /**
   * Put a key null value
   * @param key key
   */
  public putNull(key: string): void {
    this.values.set(key, null);
  }

  /**
   * Get the number of value mappings
   *
   * @return size
   */
  public size(): number {
    return this.values.size;
  }

  /**
   * Get the value of the key
   * @param key key
   * @return value
   */
  public get(key: string): any {
    return this.values.get(key);
  }

  /**
   * Get a value set of the mappings
   *
   * @return value set
   */
  public valueSet(): IterableIterator<any> {
    return this.values.values();
  }

  /**
   * Get a field key set
   *
   * @return field key set
   */
  public keySet(): IterableIterator<string> {
    return this.values.keys();
  }

  /**
   * Get the key value as a string
   * @param key key
   * @return string value
   */
  public getAsString(key: string): string {
    const value = this.values.get(key);
    return value != null ? value.toString() : null;
  }

  /**
   * @inheritDoc
   */
  public toString(): string {
    const sb = [];
    for (const key of this.values.keys()) {
      const value = this.getAsString(key);
      if (sb.length > 0) {
        sb.push(' ');
      }
      sb.push(key + '=' + value);
    }
    return sb.join('');
  }
}
