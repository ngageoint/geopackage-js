var Contents = require('../../core/contents');

module.exports.FEATURES = {
  name: 'features',
  dataType: Contents.GPKG_CDT_FEATURES_NAME
};

module.exports.SIMPLE_ATTRIBUTES = {
  name: 'simple_attributes',
  dataType: Contents.GPKG_CDT_ATTRIBUTES_NAME
};

module.exports.MEDIA = {
  name: 'media',
  dataType: Contents.GPKG_CDT_ATTRIBUTES_NAME
};


module.exports.fromName = function(name) {
  return module.exports[name.toUpperCase()];
}
