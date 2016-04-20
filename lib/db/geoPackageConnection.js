
var GeoPackageConnection = function(filePath, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    this.adapterCreator = require('./sqliteAdapter');
  } else {
    this.adapterCreator = require('./sqljsAdapter');
  }

  if(filePath) {
    this.adapterCreator.createAdapter(filePath, function(err, adapter) {
      this.adapter = adapter;
      callback(err, this);
    }.bind(this));
  } else {
    callback(null, this);
  }
}

GeoPackageConnection.prototype.getDBConnection = function () {
  return this.adapter.db;
};

GeoPackageConnection.prototype.setDBConnection = function (db) {
  this.adapter = this.adapterCreator.createAdapterFromDb(db);
};

GeoPackageConnection.prototype.get = function (sql, params, callback) {
  this.adapter.get(sql, params, callback);
};

GeoPackageConnection.prototype.prepare = function () {
  this.adapter.prepare(arguments);
};

GeoPackageConnection.prototype.all = function (sql, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = [];
  }
  this.adapter.all(sql, params, callback);
};

GeoPackageConnection.prototype.each = function (sql, params, eachCallback, doneCallback) {
  if (typeof params === 'function') {
    doneCallback = eachCallback;
    eachCallback = params;
    params = [];
  }
  if (!doneCallback) doneCallback = function(){};
  this.adapter.each(sql, params, eachCallback, doneCallback);
};

GeoPackageConnection.prototype.minOfColumn = function(table, column, where, whereArgs, callback) {
  var minStatement = 'select min('+column+') as min from ' + table;
  if(where) {
    minStatement += ' ';
    if (where.indexOf('where')) {
      where = 'where ' + where;
    }
    minStatement += where;
  }
  this.adapter.get(minStatement, whereArgs, function(err, result) {
    if (err || !result) return callback(err);
    callback(err, result.min);
  });
};

GeoPackageConnection.prototype.maxOfColumn = function(table, column, where, whereArgs, callback) {
  var maxStatement = 'select max('+column+') as max from ' + table;
  if(where) {
    maxStatement += ' ';
    if (where.indexOf('where')) {
      where = 'where ' + where;
    }
    maxStatement += where;
  }
  this.adapter.get(maxStatement, whereArgs, function(err, result) {
    if (err || !result) return callback(err);
    callback(err, result.max);
  });
};

module.exports = GeoPackageConnection;

GeoPackageConnection.connect = function(filePath, callback) {
  new GeoPackageConnection(filePath, callback);
}

GeoPackageConnection.connectWithDatabase = function(db, callback) {
  new GeoPackageConnection(undefined, function(err, connection) {
    connection.setDBConnection(db);
    callback(err, connection);
  });
}
