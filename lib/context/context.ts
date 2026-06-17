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
  // @ts-ignore
  static isWebWorker: boolean = typeof importScripts !== 'undefined';

  static async initializeContext () {
    await Canvas.initializeAdapter();
  }

  /**
   * Registers the sqlite adapter. Will check for better-sqlite3 dependency before trying.
   * @private
   */
  private static registerSqliteAdapter () {
    try {
      // better-sqlite3 is an optional dependency
      require('better-sqlite3');
      Db.registerDbAdapter(SqliteAdapter);
    } catch (e) {
      console.error('Unable to register SqliteAdapter. The better-sqlite3 module was not found. Falling back to SqljsAdapter.', e);
      // fallback to sqljs adapter
      Db.registerDbAdapter(SqljsAdapter);
    }
  }

  static setupNodeContext () {
    Context.registerSqliteAdapter();
    Canvas.registerCanvasAdapter(CanvasKitCanvasAdapter);
  }

  static setupBrowserContext () {
    Db.registerDbAdapter(SqljsAdapter);
    Canvas.registerCanvasAdapter(HtmlCanvasAdapter);
  }

  static setupWebWorkerContext () {
    Db.registerDbAdapter(SqljsAdapter);
    Canvas.registerCanvasAdapter(OffscreenCanvasAdapter);
  }

  /**
   * Will attempt to register a custom context.
   * @param dbAdapter
   * @param canvasAdapter
   */
  static setupCustomContext(dbAdapter: new (path: string | Buffer | Uint8Array | undefined) => DBAdapter, canvasAdapter: new () => CanvasAdapter) {
    Db.registerDbAdapter(dbAdapter);
    Canvas.registerCanvasAdapter(canvasAdapter);
  }

  static setupDefaultContext () {
    if (Context.isNode) {
      Context.setupNodeContext();
    } else if (Context.isBrowser) {
      Context.setupBrowserContext()
    } else if (Context.isWebWorker) {
      Context.setupWebWorkerContext()
    }
  }
}
