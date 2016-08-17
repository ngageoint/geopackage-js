var async = require('async')
  , fs = require('fs');

module.exports.createAdapter = function(filePath, callback) {
  var sqlite3 = require('sqlite3').verbose();
  this.filePath = filePath;
  var db = new sqlite3.Database(filePath, function(err) {
    if (err) {
      console.log('cannot open ' + filePath);
      return callback(err);
    }
    var adapter = new Adapter(db);
    callback(err, adapter);
  });
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
  fs.readFile(filePath, callback);
}

Adapter.prototype.getDBConnection = function () {
  return this.db;
};

Adapter.prototype.get = function (sql, params, callback) {
  this.db.get.apply(this.db, arguments);
};

Adapter.prototype.prepare = function () {
  this.db.prepare.apply(this.db, arguments);
};

Adapter.prototype.all = function (sql, params, callback) {
  this.db.all.apply(this.db, arguments);
};

Adapter.prototype.run = function(sql, params, callback) {
  if (callback) {
    return this.db.run(sql, params, callback);
  }
  this.db.run(sql, params);
}

Adapter.prototype.insert = function(sql, params, callback) {
  this.db.run(sql, params, function(err) {
    if(err) return callback(err);
    return callback(err, this.lastID);
  });
};

Adapter.prototype.delete = function(sql, params, callback) {
  this.db.run(sql, params, function(err) {
    callback(err, this.changes);
  });
};

Adapter.prototype.each = function (sql, params, eachCallback, doneCallback) {
  if (eachCallback) {
    var rowCallback = function(err, result) {
      eachCallback(err, result, function() {});
    }
  }
  this.db.each(sql, params, rowCallback, doneCallback);
};

Adapter.prototype.dropTable = function(table, callback) {
  this.db.run('DROP TABLE IF EXISTS ' + table, function(err) {
    if(err) return callback(err);
    return callback(err, !!this.changes);
  });
};

Adapter.prototype.count = function (tableName, callback) {
  this.get('SELECT COUNT(*) as count FROM ' + tableName, function(err, result) {
    callback(err, result.count);
  });
};
