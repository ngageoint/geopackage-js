var GeoPackageConnection = function(filePath, callback) {
  this.isNode = true;
  if (typeof(process) !== 'undefined' && process.version) {
    this.isNode = true;
  } else {
    this.isNode = false;
  }

  if(filePath) {
    if(this.isNode) {
      constructSqlite3(filePath, function(err, db) {
        this.setDBConnection(db);
        this.sqlite3 = true;
        callback(err, this);
      }.bind(this));
    } else {
      constructSqljs(filePath, function(err, db) {
        this.setDBConnection(db);
        this.sqlite3 = false;
        callback(err, this);
      }.bind(this));
    }
  } else {
    callback(null, this);
  }
}

function constructSqlite3(filePath, callback) {
  var sqlite3 = require('sqlite3').verbose();
  var db = new sqlite3.Database(filePath, function(err) {
    console.log('err', err);
    if (err) {
      console.log('cannot open ' + filePath);
      return callback(err);
    }
    callback(err, db);
  });
}

function constructSqljs(filePath, callback) {
  var fs = require('fs');
  var sqljs = require('sql.js');
  fs.readFile(filePath, function(err, fileBuffer) {
    var db = new sqljs.Database(fileBuffer);
    callback(err, db);
  });
}

GeoPackageConnection.prototype.getDBConnection = function () {
  return this.db;
};

GeoPackageConnection.prototype.setDBConnection = function (db) {
  if (db.open) {
    this.sqlite3 = true;
  } else {
    this.sqlite3 = false;
  }
  this.db = db;
};

GeoPackageConnection.prototype.get = function (sql, params, callback) {
  if (this.sqlite3) {
    this.db.get.apply(this.db, arguments);
  } else {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    var statement = this.db.prepare(sql);
    statement.bind(params);
    var hasResult = statement.step();
    var row;
    if (hasResult) {
      row = statement.getAsObject();
    }
    statement.free();
    callback(null, row);
  }
};

GeoPackageConnection.prototype.prepare = function () {
  this.db.prepare.apply(this.db, arguments);
};

GeoPackageConnection.prototype.all = function (sql, params, callback) {
  if (this.sqlite3) {
    this.db.all.apply(this.db, arguments);
  } else {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    var rows = [];
    this.each(sql, params, function(err, row) {
      rows.push(row);
    }, function(err) {
      console.log('calling back from the all');
      callback(err, rows);
    });
  }
};

GeoPackageConnection.prototype.each = function (sql, params, eachCallback, doneCallback) {
  if (this.sqlite3) {
    this.db.each.apply(this.db, arguments);
  } else {
    if (typeof params === 'function') {
      doneCallback = eachCallback;
      eachCallback = params;
      params = [];
    }
    rowCallback = function(row) {
      if (eachCallback) {
        eachCallback(null, row);
      }
    };
    this.db.each(sql, params, rowCallback, doneCallback);
  }
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
