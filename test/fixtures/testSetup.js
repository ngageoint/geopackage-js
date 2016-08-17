var fs = require('fs')
  , async = require('async')
  , path = require('path')
  , imagediff = require('imagediff')
  , TableCreator = require('../../lib/db/tableCreator')
  , GeoPackage = require('../../lib/geoPackage')
  , GeoPackageConnection = require('../../lib/db/geoPackageConnection');

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
    GeoPackageConnection.connect(gppath, function(err, connection) {
      var geopackage = new GeoPackage(path.basename(gppath), gppath, connection);
      var tc = new TableCreator(geopackage);
      tc.createRequired(function() {
        callback(null, geopackage);
      });
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
    GeoPackageConnection.connect(gppath, function(err, connection) {
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

module.exports.diffImagesWithDimensions = function(actualTile, expectedTilePath, width, height, callback) {
  if (typeof(process) !== 'undefined' && process.version) {
    fs.writeFileSync('/tmp/gptile.png', actualTile);
    var imageDiff = require('image-diff');
    imageDiff({
      actualImage: '/tmp/gptile.png',
      expectedImage: expectedTilePath,
      diffImage: '/tmp/diff.png',
    }, function (err, imagesAreSame) {
      fs.unlinkSync('/tmp/gptile.png');
      callback(err, imagesAreSame);
    });
  } else {
    var actual = imagediff.createCanvas(width, height);
    var ctx = actual.getContext('2d');

    var image = new Image();
    image.onload = function() {
      ctx.drawImage(image, 0, 0);
      module.exports.loadTile(expectedTilePath, function(err, expectedTile) {
        var expectedBase64 = new Buffer(expectedTile).toString('base64');

        var expected = imagediff.createCanvas(width, height);
        var ctx2 = expected.getContext('2d');
        var image2 = new Image();
        image2.onload = function() {
          ctx2.drawImage(image2, 0, 0);
          var diff = imagediff.diff(actual, expected);
          var equal = imagediff.equal(actual, expected, 2);

          if (!equal) {
            var diffCanvas = imagediff.createCanvas(diff.width, diff.height);
            context = diffCanvas.getContext('2d');
            context.putImageData(diff, 0, 0);
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
            currentTag.appendChild(diffCanvas);
          }

          callback(null, equal);
        }
        image2.src = 'data:image/png;base64,' + expectedBase64;
      });
    };
    image.src = actualTile;
  }

}
