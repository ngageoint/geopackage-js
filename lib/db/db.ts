export class Db {
  private static adapterCreator: any = undefined;

  static registerDbAdapter (adapter) {
    Db.adapterCreator = adapter;
  }

  static create (path?: string | Buffer | Uint8Array | undefined) {
    return new Db.adapterCreator(path);
  }
}
