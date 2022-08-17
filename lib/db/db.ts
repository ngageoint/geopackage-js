import { DBAdapter } from './dbAdapter';

export class Db {
  private static adapterCreator: new (path: string | Buffer | Uint8Array | undefined) => DBAdapter = undefined;

  static registerDbAdapter(adapter: new (path: string | Buffer | Uint8Array | undefined) => DBAdapter): void {
    Db.adapterCreator = adapter;
  }

  static create(path?: string | Buffer | Uint8Array | undefined): DBAdapter {
    return new Db.adapterCreator(path);
  }
}
