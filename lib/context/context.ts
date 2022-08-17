import { Db } from '../db/db';
import { DBAdapter } from '../db/dbAdapter';
import { SqliteAdapter } from '../db/sqliteAdapter';
import { SqljsAdapter } from '../db/sqljsAdapter';
import { Canvas } from '../canvas/canvas';
import { CanvasAdapter } from '../canvas/canvasAdapter';
import { CanvasKitCanvasAdapter } from '../canvas/canvasKitCanvasAdapter';
import { HtmlCanvasAdapter } from '../canvas/htmlCanvasAdapter';
import { OffscreenCanvasAdapter } from '../canvas/offscreenCanvasAdapter';

export class Context {
  static isNode: boolean = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
  static isBrowser: boolean = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  static isWebWorker: boolean = typeof importScripts !== 'undefined';

  static async initializeContext(): Promise<void> {
    await Canvas.initializeAdapter();
  }

  /**
   * Registers the sqlite adapter. Will check for better-sqlite3 dependency before trying.
   * @private
   */
  private static registerSqliteAdapter(): void {
    try {
      // better-sqlite3 is an optional dependency
      require('better-sqlite3');
      Db.registerDbAdapter(SqliteAdapter);
    } catch (e) {
      console.error(
        'Unable to register SqliteAdapter. The better-sqlite3 module was not found. Falling back to SqljsAdapter.',
      );
      // fallback to sqljs adapter
      Db.registerDbAdapter(SqljsAdapter);
    }
  }

  /**
   * Sets up GeoPackage for Node.js
   */
  static setupNodeContext(): void {
    Context.registerSqliteAdapter();
    Canvas.registerCanvasAdapter(CanvasKitCanvasAdapter);
  }

  /**
   * Sets up GeoPackage for Browser
   */
  static setupBrowserContext(): void {
    Db.registerDbAdapter(SqljsAdapter);
    Canvas.registerCanvasAdapter(HtmlCanvasAdapter);
  }

  /**
   * Sets up GeoPackage for WebWorker
   */
  static setupWebWorkerContext(): void {
    Db.registerDbAdapter(SqljsAdapter);
    Canvas.registerCanvasAdapter(OffscreenCanvasAdapter);
  }

  /**
   * Will attempt to register a custom context.
   * @param dbAdapter
   * @param canvasAdapter
   */
  static setupCustomContext(
    dbAdapter: new (path: string | Buffer | Uint8Array | undefined) => DBAdapter,
    canvasAdapter: new () => CanvasAdapter,
  ): void {
    Db.registerDbAdapter(dbAdapter);
    Canvas.registerCanvasAdapter(canvasAdapter);
  }

  static setupDefaultContext(): void {
    if (Context.isNode) {
      Context.setupNodeContext();
    } else if (Context.isBrowser) {
      Context.setupBrowserContext();
    } else if (Context.isWebWorker) {
      Context.setupWebWorkerContext();
    }
  }
}
