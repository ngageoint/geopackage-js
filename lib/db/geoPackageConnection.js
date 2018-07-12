var GeoPackageConstants = require('../geoPackageConstants');

var GeoPackageConnection = function(filePath) {
  if (typeof(process) !== 'undefined' && process.version) {
    this.adapterCreator = require('./sqliteAdapter');
  } else {
    this.adapterCreator = require('./sqljsAdapter');
  }

  var promise = new Promise(function(resolve, reject) {
    this.adapterCreator.createAdapter(filePath)
    .then(function(adapter) {
      this.adapter = adapter;
      resolve(this);
    }.bind(this))
    .catch(function(error) {
      reject(error);
    });
  }.bind(this));

  return promise;
}

GeoPackageConnection.prototype.close = function() {
  this.adapter.close();
}

GeoPackageConnection.prototype.export = function(callback) {
  this.adapter.export(callback);
}

GeoPackageConnection.prototype.getDBConnection = function () {
  return this.adapter.db;
};

GeoPackageConnection.prototype.setDBConnection = function (db) {
  this.adapter = this.adapterCreator.createAdapterFromDb(db);
};

GeoPackageConnection.prototype.get = function (sql, params) {
  return this.adapter.get(sql, params);
};

GeoPackageConnection.prototype.run = function (sql, params) {
  return this.adapter.run(sql, params)
  // return new Promise(function(resolve, reject) {
  //   resolve(this.adapter.run(sql, params));
  // }.bind(this));
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
  try {
    var result = this.adapter.get(minStatement, whereArgs);
    callback(null, result.min);
  } catch (e) {
    callback(e);
  }
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
  try {
    var result = this.adapter.get(maxStatement, whereArgs);
    callback(null, result.max);
  } catch (e) {
    callback(e);
  }
};

GeoPackageConnection.prototype.count = function(table, callback) {
  this.adapter.count(table, callback);
};

GeoPackageConnection.prototype.insert = function (sql, params, callback) {
  this.adapter.insert(sql, params, callback);
};

GeoPackageConnection.prototype.delete = function(tableName, where, whereArgs, callback) {
  var deleteStatement = 'DELETE FROM ' + tableName + '';

  if (where) {
    deleteStatement += ' WHERE ' + where;
  }

  this.adapter.delete(deleteStatement, whereArgs, callback);
};

GeoPackageConnection.prototype.dropTable = function(tableName, callback) {
  this.adapter.dropTable(tableName, callback);
};

GeoPackageConnection.prototype.tableExists = function(tableName) {
  return this.adapter.get('SELECT name FROM sqlite_master WHERE type="table" AND name=?', [tableName]);
};

GeoPackageConnection.prototype.setApplicationId = function() {
  // return new Promise(function(resolve, reject) {
    var buff = new Buffer(GeoPackageConstants.APPLICATION_ID);
    var applicationId = buff.readUInt32BE(0);
    this.adapter.run('PRAGMA application_id = ' + applicationId);
    this.adapter.run('PRAGMA user_version = ' + GeoPackageConstants.USER_VERSION);
    // .then(function() {
    //   return this.adapter.run('PRAGMA user_version = ' + GeoPackageConstants.USER_VERSION);
    // }.bind(this));
}

GeoPackageConnection.prototype.getApplicationId = function(callback) {
  return this.adapter.get('PRAGMA application_id').application_id;
}

module.exports = GeoPackageConnection;

GeoPackageConnection.connect = function(filePath) {
  return new GeoPackageConnection(filePath);
}

GeoPackageConnection.connectWithDatabase = function(db, callback) {
  return new GeoPackageConnection(undefined)
  .then(function(connection) {
    connection.setDBConnection(db);
  });
}
