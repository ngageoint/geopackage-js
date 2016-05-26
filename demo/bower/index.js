// including from https://github.com/sindresorhus/file-type due to no bower.json
function fileType(buf) {
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
    return {
      ext: 'jpg',
      mime: 'image/jpeg'
    };
  }

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return {
      ext: 'png',
      mime: 'image/png'
    };
  }
}

var GeoPackageAPI = geopackage;
