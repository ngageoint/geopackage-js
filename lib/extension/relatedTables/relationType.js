var ContentsDao = require('../../core/contents').ContentsDao;

module.exports.FEATURES = {
  name: 'features',
  dataType: ContentsDao.GPKG_CDT_FEATURES_NAME
};

module.exports.SIMPLE_ATTRIBUTES = {
  name: 'simple_attributes',
  dataType: ContentsDao.GPKG_CDT_ATTRIBUTES_NAME
};

module.exports.MEDIA = {
  name: 'media',
  dataType: ContentsDao.GPKG_CDT_ATTRIBUTES_NAME
};


module.exports.fromName = function(name) {
  return module.exports[name.toUpperCase()];
}
