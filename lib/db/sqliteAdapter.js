var async = require('async')
  , fs = require('fs')
  , path = require('path')
  , os = require('os');

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

module.exports.createAdapterFromDb = function(db) {
  return new Adapter(db);
}

function Adapter(db) {
  this.db = db;
}

Adapter.prototype.close = function() {
  this.db.close();
}

Adapter.prototype.export = function(callback) {
  fs.readFile(this.filePath, callback);
}

Adapter.prototype.getDBConnection = function () {
  return this.db;
};

Adapter.prototype.get = function (sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  try {
    var statement = this.db.prepare(sql);
    var row = statement.get(params);
    callback(null, row);
  } catch (e) {
    console.log('Error in DB Get', e);

    callback(e);
  }
};

Adapter.prototype.all = function (sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  try {
    var statement = this.db.prepare(sql);
    var rows = statement.all(params);
    callback(null, rows);
  } catch (e) {
    console.log('Database All error', e);
    callback(e);
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

Adapter.prototype.insert = function(sql, params, callback) {
  try {
    var statement = this.db.prepare(sql);
    var result = statement.run(params);
    return callback(null, result.lastInsertROWID);
  } catch (e) {
    return callback(e);
  }
};

Adapter.prototype.delete = function(sql, params, callback) {
  try {
    var statement = this.db.prepare(sql);
    var result = statement.run(params);
    return callback(null, result.changes);
  } catch (e) {
    console.log('Delete DB Error', e);
    return callback(e);
  }
};

Adapter.prototype.each = function (sql, params, eachCallback, doneCallback) {
  try {
    var statement = this.db.prepare(sql);
    var iterator = statement.iterate(params);
    var it;
    var count = 0;
    async.whilst(
      function() {
        it = iterator.next();
        return !it.done;
      },
      function(callback) {
        async.setImmediate(function() {
          count++;
          eachCallback(null, it.value, callback);
        });
      },
      function() {
        iterator.return();
        doneCallback(null, count);
      }
    );
  } catch (e) {
    if (iterator) {
      iterator.return();
    }
    return doneCallback(e);
  }
};

Adapter.prototype.dropTable = function(table, callback) {
  try {
    var statement = this.db.prepare('DROP TABLE IF EXISTS "' + table + '"');
    var result = statement.run();
    return callback(null, result.changes == 0);
  } catch (e) {
    console.log('Drop Table Error', e);
    callback(e);
  }
};

Adapter.prototype.count = function (tableName, callback) {
  try {
    var statement = this.db.prepare('SELECT COUNT(*) as count FROM "' + tableName + '"');
    var row = statement.get();
    callback(null, row.count);
  } catch (e) {
    console.log('count error', e);
    callback(e);
  }
};
