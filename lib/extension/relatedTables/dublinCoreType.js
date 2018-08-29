module.exports.DATE = {
  name: 'date'
};

module.exports.DESCRIPTION = {
  name: 'description'
};

module.exports.FORMAT = {
  name: 'format',
  synonyms: ['content_type']
};

module.exports.IDENTIFIER = {
  name: 'identifier',
  synonyms: ['id']
};

module.exports.SOURCE = {
  name: 'source'
};

module.exports.TITLE = {
  name: 'title'
};

module.exports.fromName = function(name) {
  for (var prop in module.exports) {
    var type = module.exports[prop];
    if (type.name === name) {
      return type;
    }
  }
  for (var prop in module.exports) {
    var type = module.exports[prop];
    if (type.synonyms) {
      for (var i = 0; i < type.synonyms.length; i++) {
        if (type.synonyms[i] === name) {
          return type;
        }
      }
    }
  }
}
