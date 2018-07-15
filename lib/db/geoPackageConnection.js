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
};

GeoPackageConnection.prototype.all = function (sql, params) {
  return this.adapter.all(sql, params);
};

GeoPackageConnection.prototype.each = function (sql, params) {
  return this.adapter.each(sql, params);
};

GeoPackageConnection.prototype.minOfColumn = function(table, column, where, whereArgs) {
  var minStatement = 'select min('+column+') as min from ' + table;
  if(where) {
    minStatement += ' ';
    if (where.indexOf('where')) {
      where = 'where ' + where;
    }
    minStatement += where;
  }
  return this.adapter.get(minStatement, whereArgs).min;
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
  return this.adapter.get(maxStatement, whereArgs).max;
};

GeoPackageConnection.prototype.count = function(table) {
  return this.adapter.count(table);
};

GeoPackageConnection.prototype.insert = function (sql, params) {
  return this.adapter.insert(sql, params);
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
  var buff = new Buffer(GeoPackageConstants.APPLICATION_ID);
  var applicationId = buff.readUInt32BE(0);
  this.adapter.run('PRAGMA application_id = ' + applicationId);
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
