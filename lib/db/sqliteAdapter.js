var fs = require('fs')
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

Adapter.prototype.count = function (tableName) {
  var statement = this.db.prepare('SELECT COUNT(*) as count FROM "' + tableName + '"');
  return statement.get().count;
};
