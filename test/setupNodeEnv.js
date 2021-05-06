var Db = require('../lib/db/db').Db;
var Canvas = require('../lib/canvas/canvas').Canvas;
var Creator = require('../lib/tiles/creator/creator').Creator;
var SqliteAdapter = require('../lib/db/sqliteAdapter').SqliteAdapter;
var NodeCanvasAdapter = require('../lib/canvas/nodeCanvasAdapter').NodeCanvasAdapter;
var NodeTileCreator = require('../lib/tiles/creator/node').NodeTileCreator;

before(async () => {
  Db.registerDbAdapter(SqliteAdapter);
  Creator.registerTileCreator(NodeTileCreator);
  Canvas.registerCanvasAdapter(NodeCanvasAdapter);
  await Canvas.initializeAdapter();
});
