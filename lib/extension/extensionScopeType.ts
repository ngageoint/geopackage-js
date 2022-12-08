/**
 * Extension Scope Type
 */
export enum ExtensionScopeType {
  /**
   * Read and Write
   */
  READ_WRITE = 'read-write',

  /**
   * Write Only
   */
  WRITE_ONLY = 'write-only',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ExtensionScopeType {
  export function nameFromType(type: ExtensionScopeType): string {
    return type.toLowerCase();
  }

  export function fromName(type: string): ExtensionScopeType {
    switch (type) {
      case 'read-write':
        return ExtensionScopeType.READ_WRITE;
      case 'write-only':
        return ExtensionScopeType.WRITE_ONLY;
    }
    return null;
  }
}
