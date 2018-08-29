module.exports.hasColumn = function(table, type) {
  var userTable = table;
  if (table.table) {
    userTable = table.table;
  }
  var hasColumn = userTable.hasColumn(type.name);
  if (!userTable.hasColumn(type.name)) {
    var synonyms = type.synonyms;
    if (synonyms) {
      for (var i = 0; i < synonyms.length; i++) {
        hasColumn = userTable.hasColumn(synonyms[i]);
        if (hasColumn) {
          break;
        }
      }
    }
  }
  return hasColumn;
}

module.exports.getColumn = function(table, type) {
  var userTable = table;
  if (table.table) {
    userTable = table.table;
  }
  var column;
  var hasColumn = userTable.hasColumn(type.name);
  if (hasColumn) {
    column = userTable.getColumnWithColumnName(type.name);
  } else {
    var synonyms = type.synonyms;
    if (synonyms) {
      for (var i = 0; i < synonyms.length; i++) {
        hasColumn = userTable.hasColumn(synonyms[i]);
        if (hasColumn) {
          column = userTable.getColumnWithColumnName(synonyms[i]);
          break;
        }
      }
    }
  }
  return column;
}

module.exports.getValue = function(row, type) {
  var name = module.exports.getColumn(row, type).name;
  return row.getValueWithColumnName(name);
}

module.exports.setValue = function(row, type, value) {
  var column = module.exports.getColumn(row, type);
  row.setValueWithColumnName(column.name, value);
}
