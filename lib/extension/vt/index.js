/**
 * VectorTilesExtension module.
 * @module VectorTilesExtension
 * @see module:extension/VectorTilesExtension
 */

var BaseExtension = require('../baseExtension')
  , Extension = require('../.').Extension
  , VTLayersDao = require('./vtLayersDao')
  , VTLayersTable = require('./vtLayersTable');

var util = require('util');

var VectorTilesExtension = function(geoPackage) {
  BaseExtension.call(this, geoPackage);
  this.extensionName = VectorTilesExtension.EXTENSION_NAME;
  this.extensionDefinition = VectorTilesExtension.EXTENSION_VT_DEFINITION;
}

util.inherits(VectorTilesExtension, BaseExtension);

VectorTilesExtension.prototype.getOrCreateExtension = function() {
  return this.getOrCreate(this.extensionName, null, null, this.extensionDefinition, Extension.READ_WRITE);
};

VectorTilesExtension.EXTENSION_NAME = 'im_vector_tiles_mapbox';
VectorTilesExtension.EXTENSION_VT_DEFINITION = 'https://github.com/jyutzler/geopackage-vector-tiles/blob/master/spec/1_vector_tiles.adoc';
VectorTilesExtension.VTLayersDao = VTLayersDao;
VectorTilesExtension.VTLayersTable = VTLayersTable;

module.exports = VectorTilesExtension;
