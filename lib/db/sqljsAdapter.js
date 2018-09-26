/**
 * This adapter uses sql.js to execute queries against the GeoPackage database
 * @module db/sqljsAdapter
 * @see {@link http://kripken.github.io/sql.js/documentation/|sqljs}
 */

var sqljs = require('sql.js/js/sql-memory-growth.js');
// var sqljs = require('sql.js/js/sql.js');

/**
 * Returns a Promise which, when resolved, returns a {module:db/sqljsAdapter~Adapter} which has connected to the GeoPackage database file
 * @param  {string|Buffer} [filePath] string path to an existing file or a path to where a new file will be created or a url from which to download a GeoPackage or a Uint8Array containing the contents of the file, if undefined, an in memory database is created
 * @return {Promise<module:db/sqjsAdapter~Adapter>}
 */
module.exports.createAdapter = function(filePath) {
  var promise = new Promise(function(resolve, reject) {
    if (filePath && typeof filePath === 'string') {
      if (filePath.indexOf('http') === 0) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function(e) {
          if (xhr.status !== 200) {
            var db = new sqljs.Database();
            var adapter = new Adapter(db);
            return resolve(adapter);
          }
          var uInt8Array = new Uint8Array(this.response);
          var db = new sqljs.Database(uInt8Array);
          var adapter = new Adapter(db);
          return resolve(adapter);
        };
        xhr.onerror = function(e) {
          var db = new sqljs.Database();
          var adapter = new Adapter(db);
          return resolve(adapter);
        };
        xhr.send();
      } else {
        var fs = require('fs');
        try {
          var stats = fs.statSync(filePath);
        } catch (e) {
          var db = new sqljs.Database();
          var adapter = new Adapter(db);
          return resolve(adapter);
        }
        var filebuffer = fs.readFileSync(filePath);
        var t = new Uint8Array(filebuffer);
        var db = new sqljs.Database(t);
        // console.log('setting wal mode');
        // var walMode = db.exec('PRAGMA journal_mode=DELETE');
        // console.log('walMode', walMode);
        var adapter = new Adapter(db);
        return resolve(adapter);
      }
    } else if (filePath) {
      var byteArray = filePath;
      var db = new sqljs.Database(byteArray);
      var adapter = new Adapter(db);
      return resolve(adapter);
    } else {
      var db = new sqljs.Database();
      var adapter = new Adapter(db);
      return resolve(adapter);
    }
  });

  return promise;
}

/**
 * Creates an adapter from an already established better-sqlite3 database connection
 * @param  {sqljs.Database} db sqljs database connection
 * @return {module:db/sqljsAdapter~Adapter}
 */
module.exports.createAdapterFromDb = function(db) {
  return new Adapter(db);
}

/**
 * Class which adapts generic GeoPackage queries to sqljs queries
 * @class Adapter
 * @param {sqljs.Database} db sqljs database connection
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
 * @return {sqljs.Database}
 */
Adapter.prototype.getDBConnection = function () {
  return this.db;
};

/**
 * Returns a Uint8Array containing the contents of the database as a file
 * @param  {Function} callback called when export is complete
 */
Adapter.prototype.export = function(callback) {
  callback(null, this.db.export());
}

/**
 * Registers the given function so that it can be used by SQL statements
 * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Database.html#create_function-dynamic|sqljs create_function}
 * @param  {string} name               name of function to register
 * @param  {Function} functionDefinition function to register
 * @return {module:db/sqljsAdapter~Adapter} this
 */
Adapter.prototype.registerFunction = function(name, functionDefinition) {
  this.db.create_function(name, functionDefinition);
  return this;
}

/**
 * Gets one row of results from the statement
 * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Statement.html#get-dynamic|sqljs get}
 * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Statement.html#getAsObject-dynamic|sqljs getAsObject}
 * @param  {string} sql    statement to run
 * @param  {Array|Object} [params] substitution parameters
 * @return {Object}
 */
Adapter.prototype.get = function (sql, params) {
  params = params || [];
  var statement = this.db.prepare(sql);
  statement.bind(params);
  var hasResult = statement.step();
  var row;

  if (hasResult) {
    row = statement.getAsObject();
  }

  statement.free();
  return row;
};

/**
 * Gets all results from the statement in an array
 * @param  {string} sql    statement to run
 * @param  {Array|Object} [params] bind parameters
 * @return {Object[]}
 */
Adapter.prototype.all = function (sql, params) {
  var rows = [];
  var iterator = this.each(sql, params);
  for (var row of iterator) {
    rows.push(row);
  }
  return rows;
};

/**
 * Returns an Iterable with results from the query
 * @param  {string} sql    statement to run
 * @param  {Object|Array} params bind parameters
 * @return {Iterable<Object>}
 */
Adapter.prototype.each = function (sql, params) {
  var statement = this.db.prepare(sql);
  statement.bind(params);

  return {
    [Symbol.iterator]() {
      return this;
    },
    next: function() {
      if (statement.step()) {
        return {
          value: statement.getAsObject(),
          done: false
        };
      } else {
        statement.free();
        return {
          done: true
        }
      }
    }
  }
};

/**
 * Runs the statement specified, returning information about what changed
 * @see {@link http://kripken.github.io/sql.js/documentation/#http://kripken.github.io/sql.js/documentation/class/Statement.html#run-dynamic|sqljs run}
 * @param  {string} sql    statement to run
 * @param  {Object|Array} [params] bind parameters
 * @return {Object} object containing a changes property indicating the number of rows changed and a lastInsertROWID indicating the last inserted row
 */
Adapter.prototype.run = function(sql, params) {
  if (params) {
    for (var key in params) {
      params['$' + key] = params[key];
    }
  }
  this.db.run(sql, params);
  var lastId = this.db.exec('select last_insert_rowid();');
  var lastInsertedId;
  if (lastId) {
    lastInsertedId = lastId[0].values[0][0];
  }
  return {
    lastInsertROWID: lastInsertedId,
    changes: this.db.getRowsModified()
  };
};

/**
 * Runs the specified insert statement and returns the last inserted id or undefined if no insert happened
 * @param  {string} sql    statement to run
 * @param  {Object|Array} [params] bind parameters
 * @return {Number} last inserted row id
 */
Adapter.prototype.insert = function(sql, params) {
  if (params) {
    for (var key in params) {
      params['$' + key] = params[key];
    }
  }
  var statement = this.db.prepare(sql, params);
  statement.step();
  statement.free();
  var lastId = this.db.exec('select last_insert_rowid();');
  if (lastId) {
    return lastId[0].values[0][0];
  } else {
    return;
  }
};

/**
 * Runs the specified delete statement and returns the number of deleted rows
 * @param  {string} sql    statement to run
 * @param  {Object|Array} [params] bind parameters
 * @return {number} deleted rows
 */
Adapter.prototype.delete = function(sql, params) {
  var rowsModified = 0;
  var statement = this.db.prepare(sql, params);
  statement.step();
  rowsModified = this.db.getRowsModified();
  statement.free();
  return rowsModified;
};

/**
 * Drops the table
 * @param  {string} table table name
 * @return {Boolean} indicates if the table was dropped
 */
Adapter.prototype.dropTable = function(table) {
  var response = this.db.exec('DROP TABLE IF EXISTS "' + table + '"');
  return !!response;
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
  return this.get(sql, whereArgs).count;
};
