/**
 * DBValue can be a boolean, string, number, Buffer or Uint8Array
 *
 * TODO:
 * This should allow `null` as well, but adding that could be a breaking change to clients.
 * Additionally set `"strictNullChecks": true` in tsconfig.
 */
export type DBValue = boolean | string | number | Buffer | Uint8Array;
