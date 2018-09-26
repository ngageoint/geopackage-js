/**
 * @module  extension/relatedTables
 */

/**
 * Dublin Core Metadata Initiative term types
 * @class
 */
function DublinCoreType() {}

module.exports = DublinCoreType;

/**
 * A point or period of time associated with an event in the lifecycle of
 * the resource.
 * @type {Object}
 */
DublinCoreType.DATE = {
  name: 'date'
};

/**
 * An account of the resource.
 * @type {Object}
 */
DublinCoreType.DESCRIPTION = {
  name: 'description'
};

/**
 * The file format, physical medium, or dimensions of the resource.
 * @type {Object}
 */
DublinCoreType.FORMAT = {
  name: 'format',
  synonyms: ['content_type']
};

/**
 * An unambiguous reference to the resource within a given context.
 * @type {Object}
 */
DublinCoreType.IDENTIFIER = {
  name: 'identifier',
  synonyms: ['id']
};

/**
 * A related resource from which the described resource is derived.
 * @type {Object}
 */
DublinCoreType.SOURCE = {
  name: 'source'
};

/**
 * A name given to the resource.
 * @type {Object}
 */
DublinCoreType.TITLE = {
  name: 'title'
};

/**
 * Get the Dublin Core Type from the name
 * @param  {string} name name
 * @return {module:extension/relatedTables~DublinCoreType}
 */
DublinCoreType.fromName = function(name) {
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
