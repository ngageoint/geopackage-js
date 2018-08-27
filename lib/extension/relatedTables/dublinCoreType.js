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
  switch(name) {
    case 'format':
      return module.exports.FORMAT;
    case 'identifier':
      return module.exports.IDENTIFIER;
    case 'source':
      return module.exports.SOURCE;
    case 'title':
      return module.exports.TITLE;
  }
}
