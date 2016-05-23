var async = require('async');

module.exports.createAdapter = function(filePath, callback) {
  var fs = require('fs');
  var sqljs = require('sql.js');
  fs.readFile(filePath, function(err, fileBuffer) {
    var db = new sqljs.Database(fileBuffer);
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

Adapter.prototype.getDBConnection = function () {
  return this.db;
};

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
  console.log('sql', sql);
  console.log('params', params);
  var statement = this.db.prepare(sql);
  statement.bind(params);

  async.whilst(
    function() {
      return statement.step();
    },
    function(callback) {
      async.setImmediate(function() {
        var row = statement.getAsObject();
        eachCallback(null, row, callback);
      });
    },
    function() {
      statement.free();
      doneCallback();
    }
  );
};

Adapter.prototype.count = function (tableName, callback) {
  this.get('SELECT COUNT(*) as count FROM ' + tableName, function(err, result) {
    callback(err, result.count);
  });
};
