/**
 * This adapter uses better-sqlite3 to execute queries against the GeoPackage database
 * @module db/sqliteAdapter
 * @see {@link https://github.com/JoshuaWise/better-sqlite3|better-sqlite3}
 */

var fs = require('fs')
  , path = require('path')
  , os = require('os');

/**
 * Returns a Promise which, when resolved, returns a {module:db/sqliteAdapter~Adapter} which has connected to the GeoPackage database file
 * @param  {string|Buffer} [filePath] string path to an existing file or a path to where a new file will be created or a Buffer containing the contents of the file, if undefined, an in memory database is created
 * @return {Promise<module:db/sqliteAdapter~Adapter>}
 */
module.exports.createAdapter = function(filePath) {
  var promise = new Promise(function(resolve, reject) {
    var Database = require('better-sqlite3');
    try {
      var db;
      if (filePath && typeof filePath === 'string') {
        db = new Database(filePath);
      } else if (filePath) {
        // write this byte array to a file then open it
        var byteArray = filePath;
        var tmpPath = path.join(os.tmpDir(), Date.now() + '.gpkg');
        return fs.writeFile(tmpPath, byteArray, function(err) {
          db = new Database(tmpPath);
          // verify that this is an actual database
          try {
            var applicationId = db.pragma('application_id');
            db.pragma('journal_mode = WAL');
          } catch (err) {
            console.log('error', err);
            return reject(err);
          }
          var adapter = new Adapter(db);
          adapter.filePath = tmpPath;
          resolve(adapter);
        });
      } else {
        console.log('create in memory');
        db = new Database("memory", {
          memory: !filePath
        });
      }
      var adapter = new Adapter(db);
      adapter.filePath = filePath;
      resolve(adapter);
    } catch (err) {
      console.log('Error opening database', err);
      return reject(err);
    }
  });
  return promise;
}
/**
 * Creates an adapter from an already established better-sqlite3 database connection
 * @param  {better-sqlite3.Database} db better-sqlite3 database connection
 * @return {module:db/sqliteAdapter~Adapter}
 */
module.exports.createAdapterFromDb = function(db) {
  return new Adapter(db);
}

/**
 * Class which adapts generic GeoPackage queries to better-sqlite3 queries
 * @class Adapter
 * @param {better-sqlite3.Database} db better-sqlite3 database connection
 */
function Adapter(db) {
  this.db = db;
}

/**
 * Closes the connection to the GeoPackage
 */
Adapter.prototype.close = function() {
  this.db.close();
}

/**
 * Returns a Buffer containing the contents of the database as a file
 * @param  {Function} callback called when export is complete
 */
Adapter.prototype.export = function(callback) {
  fs.readFile(this.filePath, callback);
}

/**
 * Get the connection to the database file
 * @return {better-sqlite3.Database}
 */
Adapter.prototype.getDBConnection = function () {
  return this.db;
};

/**
 * Registers the given function so that it can be used by SQL statements
 * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#registeroptions-function---this|better-sqlite3 register}
 * @param  {string} name               name of function to register
 * @param  {Function} functionDefinition function to register
 * @return {better-sqlite3.Database}
 */
Adapter.prototype.registerFunction = function(name, functionDefinition) {
  return this.db.register({name: name}, functionDefinition);
}

Adapter.prototype.get = function (sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.get(params);
  } else {
    return statement.get();
  }
};

Adapter.prototype.all = function (sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.all(params);
  } else {
    return statement.all();
  }
};

Adapter.prototype.run = function(sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.run(params);
  } else {
    return statement.run();
  }
}

Adapter.prototype.insert = function(sql, params) {
  var statement = this.db.prepare(sql);
  return statement.run(params).lastInsertROWID;
};

Adapter.prototype.delete = function(sql, params) {
  var statement = this.db.prepare(sql);
  return statement.run(params).changes;
};

Adapter.prototype.each = function (sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.iterate(params);
  } else {
    return statement.iterate();
  }
};

Adapter.prototype.dropTable = function(table) {
  try {
    var statement = this.db.prepare('DROP TABLE IF EXISTS "' + table + '"');
    var result = statement.run();
    return result.changes == 0;
  } catch (e) {
    console.log('Drop Table Error', e);
    return false;
  }
};

Adapter.prototype.count = function (tableName, where, whereArgs) {
  var sql = 'SELECT COUNT(*) as count FROM "' + tableName + '"';
  if (where) {
    sql += ' where ' + where;
  }
  var statement = this.db.prepare(sql);
  if (whereArgs) {
    return statement.get(whereArgs).count;
  } else {
    return statement.get().count;
  }
};
