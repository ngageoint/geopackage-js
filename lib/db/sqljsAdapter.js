var async = require('async');

var sqljs = require('sql.js/js/sql-memory-growth');
module.exports.createAdapter = function(filePath, callback) {
  if (filePath) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filePath, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      if (xhr.status !== 200) {
        var db = new sqljs.Database();
        var adapter = new Adapter(db);
        return callback(null, adapter);
      }
      var uInt8Array = new Uint8Array(this.response);
      var db = new sqljs.Database(uInt8Array);
      var adapter = new Adapter(db);
      callback(null, adapter);
    };
    xhr.onerror = function(e) {
      var db = new sqljs.Database();
      var adapter = new Adapter(db);
      return callback(null, adapter);
    };
    xhr.send();
  } else {
    var db = new sqljs.Database();
    var adapter = new Adapter(db);
    callback(null, adapter);
  }
}

module.exports.createAdapterFromDb = function(db) {
  return new Adapter(db);
}

function Adapter(db) {
  this.db = db;
}

Adapter.prototype.close = function(cb) {
  if(this.db) {
    var tdb = this.db;
    // release native DB object
    this.db = null;
    tdb.close(cb);
  }
}

Adapter.prototype.getDBConnection = function () {
  return this.db;
};

Adapter.prototype.export = function(callback) {
  callback(null, this.db.export());
}

Adapter.prototype.get = function (sql, params, callback) {
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
};

Adapter.prototype.prepare = function () {
  this.db.prepare.apply(this.db, arguments);
};

Adapter.prototype.all = function (sql, params, callback) {
  var rows = [];
  this.each(sql, params, function(err, row, rowDone) {
    rows.push(row);
    rowDone();
  }, function(err) {
    callback(err, rows);
  });
};

Adapter.prototype.each = function (sql, params, eachCallback, doneCallback) {
  if (typeof params === 'function') {
    doneCallback = eachCallback;
    eachCallback = params;
    params = [];
  }
  var statement = this.db.prepare(sql);
  statement.bind(params);
  var count = 0;

  async.whilst(
    function() {
      return statement.step();
    },
    function(callback) {
      async.setImmediate(function() {
        var row = statement.getAsObject();
        count++;
        eachCallback(null, row, callback);
      });
    },
    function() {
      statement.free();
      doneCallback(null, count);
    }
  );
};

Adapter.prototype.run = function(sql, params, callback) {
  if (callback) {
    this.db.run(sql, params);
    return callback();
  }
  this.db.run(sql);
  params();
};

Adapter.prototype.insert = function(sql, params, callback) {
  try {
    var statement = this.db.prepare(sql, params);
    statement.step();
  } catch (e) {
    return callback(e);
  }
  statement.free();
  var lastId = this.db.exec('select last_insert_rowid();');
  if (lastId) {
    return callback(null, lastId[0].values[0][0]);
  } else {
    return callback();
  }
};

Adapter.prototype.delete = function(sql, params, callback) {
  var rowsModified = 0;
  try {
    var statement = this.db.prepare(sql, params);
    statement.step();
    rowsModified = this.db.getRowsModified();
    statement.free();
  } catch (e) {
    return callback(e);
  }
  return callback(null, rowsModified);
};

Adapter.prototype.dropTable = function(table, callback) {
  var response = this.db.exec('DROP TABLE IF EXISTS "' + table + '"');
  return callback(null, !!response);
};

Adapter.prototype.count = function (tableName, callback) {
  this.get('SELECT COUNT(*) as count FROM "' + tableName + '"', function(err, result) {
    callback(null, result.count);
  });
};
