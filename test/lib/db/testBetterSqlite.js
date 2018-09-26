var fs = require('fs');
var path = require('path');
var Database = require('better-sqlite3');
var sqliteAdapter = require('../../../lib/db/sqliteAdapter')
var testSetup = require('../../fixtures/testSetup');
var testPath = path.join(__dirname, '..', '..', 'tmp');
var testDb;

describe('Database opening tests', function(done) {

  function verifyTableExists(db) {
    var statement = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
    var results = statement.get(['mytable']);
    if(!results) {
      return false;
    }
    return true;
  }

  function createTable(db, done) {
    var create = 'CREATE TABLE mytable ('+
    '  name TEXT NOT NULL,'+
    '  id INTEGER NOT NULL PRIMARY KEY,'+
    '  description TEXT'+
    ')';
    try {
      var statement = db.prepare(create);
      statement.run();
      done();
    } catch (e) {
      done(e);
    }
  }

  var db;

  beforeEach(function(done) {
    testDb = path.join(testPath, testSetup.createTempName());
    testSetup.createGeoPackage(testDb, function(err, gp) {
      db = gp.getDatabase().getDBConnection();
      done();
    });
  });

  afterEach(function(done) {
    testSetup.deleteGeoPackage(testDb, done);
  });

  it('should load a file synchronusly then write to the db', function(done) {
    createTable(db, function(err, results) {
      var exists = verifyTableExists(db);
      if (!exists) return done(new Error('Table does not exist'));
      var buffer = fs.readFileSync(path.join(__dirname, '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'));
      exists = verifyTableExists(db);
      if (!exists) return done(new Error('Table does not exist after file read'));
      return done();
    });
  });

  it('should load a file asynchronusly then write to the db', function(done) {
    createTable(db, function(err, results) {
      var exists = verifyTableExists(db);
      if (!exists) return done(new Error('Table does not exist'));
      fs.readFile(path.join(__dirname, '..', '..', 'fixtures', 'tiles', '0', '0', '0.png'), function(err, buffer) {
        exists = verifyTableExists(db);
        if (!exists) return done(new Error('Table does not exist after file read'));
        return done();
      });
    });
  });
});
