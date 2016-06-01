
var UserUniqueConstraint = function(columns) {
  this.columns = columns;
}

UserUniqueConstraint.prototype.add = function (column) {
  this.columns.push(column);
};
