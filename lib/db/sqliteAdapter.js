/**
 * This adapter uses better-sqlite3 to execute queries against the GeoPackage database
 * @module db/sqliteAdapter
 * @see {@link https://github.com/JoshuaWise/better-sqlite3|better-sqlite3}
 */

var fs = require('fs')
  , path = require('path')
  , http = require('http')
  , Buffer = require('buffer')
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
        if (filePath.indexOf('http') === 0) {
          http.get(filePath, function(response) {
            if (response.statusCode !== 200) {
              return reject(new Error('Unable to reach url: ' + filePath));
            }
            var tmpPath = path.join(os.tmpDir(), Date.now() + '.gpkg');
            var writeStream = fs.createWriteStream(tmpPath);
            response.pipe(writeStream);
            writeStream.on('close', function() {
              try {
                db = new Database(tmpPath);
                // verify that this is an actual database
                var applicationId = db.pragma('application_id');
                db.pragma('journal_mode = WAL');
                var adapter = new Adapter(db);
                adapter.filePath = tmpPath;
                resolve(adapter);
              } catch (err) {
                console.log('error', err);
                return reject(err);
              }
            });
          });
        } else {
          db = new Database(filePath);
          var adapter = new Adapter(db);
          adapter.filePath = filePath;
          resolve(adapter);
        }
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
        var adapter = new Adapter(db);
        adapter.filePath = filePath;
        resolve(adapter);
      }

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
 * Get the connection to the database file
 * @return {better-sqlite3.Database}
 */
Adapter.prototype.getDBConnection = function () {
  return this.db;
};

/**
 * Returns a Buffer containing the contents of the database as a file
 * @param  {Function} callback called when export is complete
 */
Adapter.prototype.export = function(callback) {
  fs.readFile(this.filePath, callback);
}

/**
 * Registers the given function so that it can be used by SQL statements
 * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#registeroptions-function---this|better-sqlite3 register}
 * @param  {string} name               name of function to register
 * @param  {Function} functionDefinition function to register
 * @return {module:db/sqliteAdapter~Adapter} this
 */
Adapter.prototype.registerFunction = function(name, functionDefinition) {
  this.db.register({name: name}, functionDefinition);
  return this;
}

/**
 * Gets one row of results from the statement
 * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#getbindparameters---row|better-sqlite3 get}
 * @param  {string} sql    statement to run
 * @param  {Array|Object} [params] bind parameters
 * @return {Object}
 */
Adapter.prototype.get = function (sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.get(params);
  } else {
    return statement.get();
  }
};

/**
 * Gets all results from the statement in an array
 * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#allbindparameters---array-of-rows|better-sqlite3 all}
 * @param  {string} sql    statement to run
 * @param  {Array|Object} [params] bind parameters
 * @return {Object[]}
 */
Adapter.prototype.all = function (sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.all(params);
  } else {
    return statement.all();
  }
};

/**
 * Returns an `Iterable` with results from the query
 * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#iteratebindparameters---iterator|better-sqlite3 iterate}
 * @param  {string} sql    statement to run
 * @param  {Object|Array} [params] bind parameters
 * @return {Iterable<Object>}
 */
Adapter.prototype.each = function (sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.iterate(params);
  } else {
    return statement.iterate();
  }
};

/**
 * Run the given statement, returning information about what changed.
 *
 * @see {@link https://github.com/JoshuaWise/better-sqlite3/wiki/API#runbindparameters---object|better-sqlite3}
 * @param  {string} sql    statement to run
 * @param  {Object|Array} [params] bind parameters
 * @return {{changes: number, lastInsertROWID: number}} object: `{ "changes": number, "lastInsertROWID": number }`
 * * `changes`: number of rows the statement changed
 * * `lastInsertROWID`: ID of the last inserted row
 */
Adapter.prototype.run = function(sql, params) {
  var statement = this.db.prepare(sql);
  if (params) {
    return statement.run(params);
  } else {
    return statement.run();
  }
}

/**
 * Runs the specified insert statement and returns the last inserted id or undefined if no insert happened
 * @param  {string} sql    statement to run
 * @param  {Object|Array} [params] bind parameters
 * @return {Number} last inserted row id
 */
Adapter.prototype.insert = function(sql, params) {
  var statement = this.db.prepare(sql);
  return statement.run(params).lastInsertROWID;
};

/**
 * Runs the specified delete statement and returns the number of deleted rows
 * @param  {string} sql    statement to run
 * @param  {Object|Array} params bind parameters
 * @return {number} deleted rows
 */
Adapter.prototype.delete = function(sql, params) {
  var statement = this.db.prepare(sql);
  return statement.run(params).changes;
};

/**
 * Drops the table
 * @param  {string} table table name
 * @return {Boolean} indicates if the table was dropped
 */
Adapter.prototype.dropTable = function(table) {
  try {
    var statement = this.db.prepare('DROP TABLE IF EXISTS "' + table + '"');
    var result = statement.run();
    var vacuum = this.db.prepare('VACUUM');
    vacuum.run();
    return result.changes == 0;
  } catch (e) {
    console.log('Drop Table Error', e);
    return false;
  }
};

/**
 * Counts rows that match the query
 * @param  {string} tableName table name from which to count
 * @param  {string} [where]     where clause
 * @param  {Object|Array} [whereArgs] where args
 * @return {Number} count
 */
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
