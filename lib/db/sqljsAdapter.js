var async = require('async');

var sqljs = require('sql.js/js/sql-memory-growth.js');
// var sqljs = require('sql.js/js/sql.js');

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

module.exports.createAdapterFromDb = function(db) {
  return new Adapter(db);
}

function Adapter(db) {
  this.db = db;
}

Adapter.prototype.close = function() {
  this.db.close();
}

Adapter.prototype.getDBConnection = function () {
  return this.db;
};

Adapter.prototype.export = function(callback) {
  callback(null, this.db.export());
}

Adapter.prototype.registerFunction = function(name, functionDefinition) {
  return this.db.create_function(name, functionDefinition);
}

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

Adapter.prototype.all = function (sql, params) {
  var rows = [];
  var iterator = this.each(sql, params);
  for (var row of iterator) {
    rows.push(row);
  }
  return rows;
};

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

Adapter.prototype.run = function(sql, params) {
  if (params) {
    for (var key in params) {
      params['$' + key] = params[key];
    }
  }
  return this.db.run(sql, params);
};

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

Adapter.prototype.delete = function(sql, params) {
  var rowsModified = 0;
  var statement = this.db.prepare(sql, params);
  statement.step();
  rowsModified = this.db.getRowsModified();
  statement.free();
  return rowsModified;
};

Adapter.prototype.dropTable = function(table, callback) {
  var response = this.db.exec('DROP TABLE IF EXISTS "' + table + '"');
  return callback(null, !!response);
};

Adapter.prototype.count = function (tableName, callback) {
  return this.get('SELECT COUNT(*) as count FROM "' + tableName + '"').count;
};
