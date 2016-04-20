
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
  this.each(sql, params, function(err, row) {
    rows.push(row);
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
  rowCallback = function(row) {
    if (eachCallback) {
      eachCallback(null, row);
    }
  };
  this.db.each(sql, params, rowCallback, doneCallback);
};
