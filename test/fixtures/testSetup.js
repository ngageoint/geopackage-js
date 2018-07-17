var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , crypto = require('crypto')
  , pureimage = require('pureimage')
  , Duplex = require('stream').Duplex
  , TableCreator = require('../../lib/db/tableCreator')
  , GeoPackage = require('../../lib/geoPackage')
  , GeoPackageAPI = require('../..')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection');

module.exports.createTempName = function() {
  return 'gp_'+crypto.randomBytes(4).readUInt32LE(0)+'.gpkg';
}

module.exports.createGeoPackage = function(gppath, callback) {
  async.series([
    function(callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        fs.mkdir(path.dirname(gppath), function() {
          fs.open(gppath, 'w', callback);
        });
      } else {
        callback();
      }
    }
  ], function() {
    GeoPackageAPI.create(gppath)
    .then(function(geopackage) {
      callback(null, geopackage);
    });
  });
}

module.exports.createBareGeoPackage = function(gppath, callback) {
  async.series([
    function(callback) {
      if (typeof(process) !== 'undefined' && process.version) {
        fs.mkdir(path.dirname(gppath), function() {
          fs.open(gppath, 'w', callback);
        });
      } else {
        callback();
      }
    }
  ], function() {
    GeoPackageConnection.connect(gppath)
    .then(function(connection) {
      var geopackage = new GeoPackage(path.basename(gppath), gppath, connection);
      callback(null, geopackage);
    });
  });
}

module.exports.deleteGeoPackage = function(gppath, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    fs.unlink(gppath, callback);
  } else {
    callback();
  }
}

module.exports.loadTile = function(tilePath, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    fs.readFile(tilePath, callback);
  } else {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', tilePath, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      if (xhr.status !== 200) {
        return callback();
      }
      return callback(null, new Buffer(this.response));
    };
    xhr.onerror = function(e) {
      return callback();
    };
    xhr.send();
  }
}

module.exports.diffImages = function(actualTile, expectedTilePath, callback) {
  module.exports.diffImagesWithDimensions(actualTile, expectedTilePath, 256, 256, callback);
};

module.exports.diffCanvas = function(actualCanvas, expectedTilePath, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    pureimage.decodePNGFromStream(fs.createReadStream(expectedTilePath)).then(function(expectedImage) {
      var same = true;
      for (var x = 0; x < actualCanvas.width && same; x++) {
        for (var y = 0; y < actualCanvas.height && same; y++) {
          var actualRGBA = actualCanvas.getPixelRGBA(x,y);
          var expectedRGBA = expectedImage.getPixelRGBA(x,y);
          same = actualRGBA === expectedRGBA;
        }
      }
      callback(null, same);
    });
  } else {
    module.exports.loadTile(expectedTilePath, function(err, expectedTile) {
      var expectedBase64 = new Buffer(expectedTile).toString('base64');

      var expected = document.createElement('canvas');
      expected.width = actualCanvas.width;
      expected.height = actualCanvas.height;
      var ctx2 = expected.getContext('2d');

      var image2 = new Image();
      image2.onload = function() {
        ctx2.drawImage(image2, 0, 0);
        return callback(null, module.exports.diffCanvasesContexts(actualCanvas.getContext('2d'), ctx2), actualCanvas.width, actualCanvas.height);
      }
      image2.src = 'data:image/png;base64,' + expectedBase64;
    });
  }
}

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
}

module.exports.diffImagesWithDimensions = function(actualTile, expectedTilePath, width, height, callback) {
  if (typeof(process) !== 'undefined' && process.version) {

    var chunkStream = new Duplex();
    chunkStream.push(actualTile);
    chunkStream.push(null);
    pureimage.decodePNGFromStream(chunkStream).then(function(actualImage) {
      pureimage.decodePNGFromStream(fs.createReadStream(expectedTilePath)).then(function(expectedImage) {
        var same = true;
        for (var x = 0; x < actualImage.width && same; x++) {
          for (var y = 0; y < actualImage.height && same; y++) {
            var actualRGBA = actualImage.getPixelRGBA(x,y);
            var expectedRGBA = expectedImage.getPixelRGBA(x,y);
            same = actualRGBA === expectedRGBA;
          }
        }
        callback(null, same);
      });
    });
  } else {
    if (actualTile instanceof Uint8Array) {
      var binary = '';
      var bytes = actualTile;
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
      }
      actualTile = 'data:image/png;base64,' + btoa( binary );
    }


    var actual = document.createElement('canvas');
    actual.width = width;
    actual.height = height;
    var ctx = actual.getContext('2d');

    var image = new Image();
    image.onload = function() {
      ctx.drawImage(image, 0, 0);
      module.exports.loadTile(expectedTilePath, function(err, expectedTile) {
        var expectedBase64 = new Buffer(expectedTile).toString('base64');

        var expected = document.createElement('canvas');
        expected.width = width;
        expected.height = height;
        var ctx2 = expected.getContext('2d');

        var image2 = new Image();
        image2.onload = function() {
          ctx2.drawImage(image2, 0, 0);

          var equal = module.exports.diffCanvasesContexts(ctx, ctx2, width, height);
          if (!equal) {
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
          }
          callback(null, equal);
        }
        image2.src = 'data:image/png;base64,' + expectedBase64;
      });
    };
    image.src = actualTile;
  }

}
