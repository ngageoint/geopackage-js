var async = require('async');

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

function tile2lon(x,z) {
  return (x/Math.pow(2,z)*360-180);
}

function tile2lat(y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function long2tile(lon,zoom) {
  return Math.min(Math.pow(2,zoom)-1, (Math.floor((lon+180)/360*Math.pow(2,zoom))));
}

function lat2tile(lat,zoom) {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}

var zoomLevelResolutions = [156412,78206,39103,19551,9776,4888,2444,1222,610.984,305.492,152.746,76.373,38.187,19.093,9.547,4.773,2.387,1.193,0.596,0.298];

exports.getZoomLevelResolution = function(z) {
	return zoomLevelResolutions[z];
};

exports.getXYZFullyEncompassingExtent = function(extent, minZoom, maxZoom) {
	var zoom = maxZoom || 18;
	var min = minZoom || 0;
	//find the first zoom level with 1 tile
	var y = exports.calculateYTileRange(extent, zoom);
	var x = exports.calculateXTileRange(extent, zoom);
	var found = false;
	for (zoom; zoom >= min && !found; zoom--) {
		y = exports.calculateYTileRange(extent, zoom);
		x = exports.calculateXTileRange(extent, zoom);
		if (y.min === y.max && x.min === x.max) {
			found = true;
		}
	}
  if (found) {
  	zoom = zoom+1;
  } else {
    y = exports.calculateYTileRange(extent, minZoom);
		x = exports.calculateXTileRange(extent, minZoom);
    zoom = minZoom;
  }
	return {
		z: zoom,
		x: x.min,
		y: y.min
	};
};

exports.tileBboxCalculator = function(x, y, z) {
  x = Number(x);
  y = Number(y);
  var tileBounds = {
    north: tile2lat(y, z),
    east: tile2lon(x+1, z),
    south: tile2lat(y+1, z),
    west: tile2lon(x, z)
  };

  return tileBounds;
};

exports.calculateXTileRange = function(bbox, z) {
  var west = long2tile(bbox[0], z);
  var east = long2tile(bbox[2], z);
  return {
    min: Math.max(0, Math.min(west, east)),
    max: Math.max(0, Math.max(west, east))
  };
};

exports.calculateYTileRange = function(bbox, z) {
  var south = lat2tile(bbox[1], z);
  var north = lat2tile(bbox[3], z);
  return {
    min: Math.max(0, Math.min(south, north)),
    max: Math.max(0, Math.max(south, north)),
    current: Math.max(0,Math.min(south, north))
  };
};

exports.tileCountInExtent = function(extent, minZoom, maxZoom) {
  var tiles = 0;
  for (var zoom = minZoom; zoom <= maxZoom; zoom++) {
    var yRange = exports.calculateYTileRange(extent, zoom);
    var xRange = exports.calculateXTileRange(extent, zoom);
    tiles += (1+yRange.max-yRange.min)*(1+xRange.max-xRange.min);
  }
  return tiles;
};

exports.iterateAllTilesInExtent = function(extent, minZoom, maxZoom, data, processTileCallback, zoomCompleteCallback, completeCallback) {
  var zoom = minZoom;
  async.whilst(
    function (stopIterating) {
      return zoom <= maxZoom && !stopIterating;
    },
    function (zoomLevelDone) {
      var yRange = exports.calculateYTileRange(extent, zoom);
      var xRange = exports.calculateXTileRange(extent, zoom);
      var currentx = xRange.min;

      async.doWhilst(
        function(xRowDone) {
          getXRow(data, currentx, yRange, zoom, xRowDone, processTileCallback);
        },
        function (stopIterating) {
          currentx++;
          return currentx <= xRange.max && !stopIterating;
        },
        function (stop) {
          zoomCompleteCallback(zoom, function() {
            zoom++;
            zoomLevelDone(stop);
          });
        }
      );
    },
    function (err) {
      completeCallback(err, data);
    }
  );
};

function pushNextTileTasks(q, data, zoom, x, yRange, numberOfTasks, stopCallback) {
  if (yRange.current > yRange.max) return false;
  for (var i = yRange.current; i <= yRange.current + numberOfTasks && i <= yRange.max; i++) {
    q.push({z:zoom, x: x, y: i, data: data}, stopCallback);
  }
  yRange.current = yRange.current + numberOfTasks + 1;
  return true;
}

function getXRow(data, xRow, yRange, zoom, xRowDone, processTileCallback) {
  var q = async.queue(processTileCallback, 100);

  q.drain = function() {
    var tasksPushed = pushNextTileTasks(q, data, zoom, xRow, yRange, 10, function(stop) {
      if (stop) {
        q.kill();
        xRowDone(true);
      }
    });
    if (!tasksPushed) {
      yRange.current = yRange.min;
      xRowDone();
    }
  };
  pushNextTileTasks(q, data, zoom, xRow, yRange, 10, function(stop) {
    if (stop) {
      q.kill();
      xRowDone(true);
    }
  });
}
