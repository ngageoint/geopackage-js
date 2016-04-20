
module.exports.createAdapter = function(filePath, callback) {
  var sqlite3 = require('sqlite3').verbose();
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

Adapter.prototype.each = function (sql, params, eachCallback, doneCallback) {
  this.db.each.apply(this.db, arguments);
};
