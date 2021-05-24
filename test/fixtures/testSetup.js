import {Canvas} from "../../lib/canvas/canvas";

var path = require('path')
  , GeoPackage = require('../../lib/geoPackage').GeoPackage
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection').GeoPackageConnection
  , crypto = require('crypto')
  , ImageUtils = require('../../lib/tiles/imageUtils').ImageUtils
  , CanvasCompare = require('canvas-compare');
var GeoPackageAPI = require('../../').GeoPackageAPI;
var isNode = typeof(process) !== 'undefined' && process.version;

var module = {
  exports: {},
};

module.exports.createTempName = function() {
  return 'gp_'+crypto.randomBytes(4).readUInt32LE(0)+'.gpkg';
};

module.exports.copyGeopackage = function(original) {
  var copy = path.join(__dirname, 'tmp', module.exports.createTempName());

  return new Promise(function(resolve, reject) {
    if (isNode) {
      var fs = require('fs-extra');
      fs.copy(original, copy, function(err) {
        resolve(copy);
      });
    } else {
      resolve(copy);
    }
  })
};

module.exports.createTmpGeoPackage = async function() {
  var tmpGpPath = path.join(__dirname, 'tmp', module.exports.createTempName());
  var geopackage = await module.exports.createGeoPackage(tmpGpPath)
  return {
    geopackage,
    path: tmpGpPath
  }
};

module.exports.createGeoPackage = async function(gppath) {
  if (isNode) {
    var fs = require('fs-extra');
    await fs.mkdirp(path.dirname(gppath));
    await fs.open(gppath, 'w');
    return await GeoPackageAPI.create(gppath)
  }
  else {
    return await GeoPackageAPI.create();
  }
};

module.exports.createBareGeoPackage = async function(gppath) {
  if (isNode) {
    var fs = require('fs-extra');
    await fs.mkdirp(path.dirname(gppath))
    await fs.open(gppath, 'w');
    let connection = await GeoPackageConnection.connect(gppath);
    return new GeoPackage(path.basename(gppath), gppath, connection);
  }
  else {
    let connection = await GeoPackageConnection.connect();
    return new GeoPackage('geopackage', undefined, connection);
  }
};

module.exports.deleteGeoPackage = async function(gppath) {
  if (isNode) {
    var fs = require('fs-extra');
    try {
      await fs.unlink(gppath);
    } catch (e) {}
  }
};

global.loadTile = module.exports.loadTile = async function(tilePath) {
  if (isNode) {
    var fs = require('fs-extra');
    return fs.readFile(tilePath);
  } else {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', tilePath, true);
      xhr.responseType = 'arraybuffer';

      xhr.onload = function(e) {
        if (xhr.status !== 200) {
          return resolve();
        }
        return resolve(Buffer.from(this.response));
      };
      xhr.onerror = function(e) {
        reject(e);
      };
      xhr.send();
    });
  }
};

module.exports.diffImages = function(actualTile, expectedTilePath, callback) {
  module.exports.diffImagesWithDimensions(actualTile, expectedTilePath, 256, 256, callback);
};

module.exports.diffCanvas = async function(actualCanvas, expectedTilePath, callback) {
  if (isNode) {
    return ImageUtils.getImage(expectedTilePath).then(img => {
      var expectedCanvas = Canvas.create(256, 256);
      expectedCanvas.getContext('2d').drawImage(img.image, 0, 0);
      let same = actualCanvas.toDataURL() === expectedCanvas.toDataURL();
      Canvas.disposeCanvas(expectedCanvas);
      Canvas.disposeImage(img);
      if (callback) {
        callback(null, same);
      }
      return same;
    });
  } else {
    module.exports.loadTile(expectedTilePath, function(err, expectedTile) {
      var expectedBase64 = Buffer.from(expectedTile).toString('base64');
      CanvasCompare.setImageData(ImageData);
      CanvasCompare.canvasCompare({
        baseImageUrl: actualCanvas.toDataURL(),
        targetImageUrl: 'data:image/png;base64,' + expectedBase64
      })
        .then(function(result) {
          if (callback) {
            callback(null, true);
          }
          return true;
        })
        .catch(function(reason) {
          if (callback) {
            callback(null, false);
          }
          return false;
        });
    });
  }

};

module.exports.diffCanvasesContexts = function(actualCtx, expectedCtx, width, height) {
  var actualData = actualCtx.getImageData(0, 0, width, height);
  var expectedData = expectedCtx.getImageData(0, 0, width, height);
  if(actualData.data.length != expectedData.data.length)
    return false;
  for(var i = 0; i < actualData.data.length; ++i){
    if(actualData.data[i] != expectedData.data[i]) {
      return false;
    }
  }
  return true;
};

module.exports.diffImagesWithDimensions = function(actualTile, expectedTilePath, width, height, callback) {
  ImageUtils.getImage(actualTile).then(actualImage => {
    const actual = Canvas.create(width, height);
    let actualCtx = actual.getContext('2d');
    actualCtx.drawImage(actualImage.image, 0, 0);
    const actualDataUrl = actual.toDataURL();
    new Promise(resolve => {
      if (!isNode) {
        module.exports.loadTile(expectedTilePath).then(expectedTileFileData => {
          ImageUtils.getImage(Buffer.from(expectedTileFileData)).then(expectedImage => {
            resolve(expectedImage);
          });
        });
      } else {
        ImageUtils.getImage(expectedTilePath).then(expectedImage => {
          resolve(expectedImage);
        });
      }
    }).then(expectedImage => {
      const expected = Canvas.create(width, height);
      let expectedCtx = expected.getContext('2d');
      expectedCtx.drawImage(expectedImage.image, 0, 0);
      const expectedDataUrl = expected.toDataURL();
      const same = actualDataUrl === expectedDataUrl;
      if (!same) {
        console.log('actual');
        console.log(actualDataUrl);
        console.log('expected');
        console.log(expectedDataUrl);
      }

      // if web, let's show on browser page
      if (!isNode) {
        if (!same) {
          var h1Tags = document.getElementsByTagName('h1');
          var h2Tags = document.getElementsByTagName('li');
          var currentTag;
          if (h2Tags.length === 0) {
            currentTag = h1Tags.item(h1Tags.length - 1);
          } else {
            currentTag = h2Tags.item(h2Tags.length -1).parentNode;
          }
          var div = document.createElement('div');
          var span1 = document.createElement('span');
          span1.style.width = width + 'px';
          span1.style.display = 'inline-block';
          span1.innerHTML = 'Actual';
          var span2 = document.createElement('span');
          span2.style.width = width + 'px';
          span2.style.display = 'inline-block';
          span2.innerHTML = 'Expected';
          var span3 = document.createElement('span');
          span3.style.width = width + 'px';
          span3.style.display = 'inline-block';
          span3.innerHTML = 'Diff';

          div.appendChild(span1);
          div.appendChild(span2);
          div.appendChild(span3);
          currentTag.appendChild(div);
          currentTag.appendChild(actual);
          currentTag.appendChild(expected);

          CanvasCompare.setImageData(ImageData);
          CanvasCompare.canvasCompare({
            baseImageUrl: actual.toDataURL(),
            targetImageUrl: expected.toDataURL()
          })
            .then(function(result) {
              currentTag.appendChild(result.producePreview());
              callback(null, false);
            })
            .catch(function(reason) {
              console.error(reason);
              callback(null, false);
            });
        } else {
          callback(null, same);
        }
      } else if (isNode) {
        // cleanup
        actualCtx = null;
        Canvas.disposeCanvas(actual);
        Canvas.disposeImage(expectedImage);
        // cleanup
        expectedCtx = null;
        Canvas.disposeCanvas(expected);

        callback(null, same);
      }
    });
  });
};

export default module.exports;
