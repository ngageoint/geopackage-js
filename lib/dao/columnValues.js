
var ColumnValues = function() {
  this.values = {};
  this.columns = [];
}

module.exports = ColumnValues;

ColumnValues.prototype.addColumn = function (column, value) {
  this.columns.push(column);
  this.values[column] = value;
};

ColumnValues.prototype.getValue = function (column) {
  return this.values[column];
};
