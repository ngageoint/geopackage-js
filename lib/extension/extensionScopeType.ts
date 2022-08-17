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
    return ExtensionScopeType[type];
  }

  export function fromName(type: string): ExtensionScopeType {
    return ExtensionScopeType[type as keyof typeof ExtensionScopeType] as ExtensionScopeType;
  }
}
