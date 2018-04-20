var proj4 = require('proj4');
proj4 = 'default' in proj4 ? proj4['default'] : proj4;

/**
 * Create a new bounding box
 * @param  {Number} minLongitudeOrBoundingBox minimum longitude or bounding box to copy (west)
 * @param  {Number} maxLongitude              maximum longitude (east)
 * @param  {Number} minLatitude               Minimum latitude (south)
 * @param  {Number} maxLatitude               Maximum latitude (north)
 * @return {BoundingBox}                      newly constructed bounding box
 */
var BoundingBox = function(minLongitudeOrBoundingBox, maxLongitude, minLatitude, maxLatitude) {
  // if there is a second argument the first argument is the minLongitude
  if (maxLongitude !== undefined) {
    this.minLongitude = minLongitudeOrBoundingBox;
    this.maxLongitude = maxLongitude;
    this.minLatitude = minLatitude;
    this.maxLatitude = maxLatitude;
  } else {
    var boundingBox = minLongitudeOrBoundingBox;
    this.minLongitude = boundingBox.minLongitude;
    this.maxLongitude = boundingBox.maxLongitude;
    this.minLatitude = boundingBox.minLatitude;
    this.maxLatitude = boundingBox.maxLatitude;
  }
}

module.exports = BoundingBox;

/**
 * Build a Geometry Envelope from the bounding box
 *
 * @return geometry envelope
 */
BoundingBox.prototype.buildEnvelope = function () {
  return {
    minY: this.minLatitude,
    minX: this.minLongitude,
    maxY: this.maxLatitude,
    maxX: this.maxLongitude
  };
};

BoundingBox.prototype.toGeoJSON = function() {
  return {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [this.minLongitude,this.minLatitude],
          [this.maxLongitude,this.minLatitude],
          [this.maxLongitude,this.maxLatitude],
          [this.minLongitude,this.maxLatitude],
          [this.minLongitude,this.minLatitude]
        ]
      ]
    }
  };
}

/**
 * Determine if equal to the provided bounding box
 * @param  {BoundingBox} boundingBox bounding boundingBox
 * @return {Boolean}             true if equal, false if not
 */
BoundingBox.prototype.equals = function (boundingBox) {
  if (!boundingBox) {
    return false;
  }

  if (this === boundingBox) {
    return true;
  }

  return this.maxLatitude === boundingBox.maxLatitude
    && this.minLatitude === boundingBox.minLatitude
    && this.maxLongitude === boundingBox.maxLongitude
    && this.maxLatitude === boundingBox.maxLatitude;
};

BoundingBox.prototype.projectBoundingBox = function (from, to) {
  if (from && from !== 'undefined' && to && to !== 'undefined') {
    var toProj = proj4(to);
    var fromProj = proj4(from);
    if (to.toUpperCase() === 'EPSG:3857' && from.toUpperCase() === 'EPSG:4326') {
      this.maxLatitude = this.maxLatitude > 85.0511 ? 85.0511 : this.maxLatitude;
      this.minLatitude = this.minLatitude < -85.0511 ? -85.0511 : this.minLatitude;
      this.minLongitude = this.minLongitude < -180.0 ? -180.0 : this.minLongitude;
      this.maxLongitude = this.maxLongitude > 180.0 ? 180.0 : this.maxLongitude;
    }
    var min = proj4(from, to, [this.minLongitude, this.minLatitude]);
    var max = proj4(from, to, [this.maxLongitude, this.maxLatitude]);
    var projected = new BoundingBox(min[0], max[0], min[1], max[1]);
    return projected;
  } else {
    return this;
  }
};



// /**
//  *  Get a Map Rectangle representing the bounding box
//  *
//  *  @return map rectangle
//  */
// -(MKMapRect) getMapRect;
//
// /**
//  *  Get a Coordinate Region of the bounding box
//  *
//  *  @return Coordinate Region
//  */
// -(MKCoordinateRegion) getCoordinateRegion;
//
// /**
//  *  Get the Span of the bounding box
//  *
//  *  @return Span
//  */
// -(MKCoordinateSpan) getSpan;
//
// /**
//  *  Get the center of the bounding box
//  *
//  *  @return center location
//  */
// -(CLLocationCoordinate2D) getCenter;
//
// /**
//  *  Get with width and height of the bounding box in meters
//  *
//  *  @return bounding box size
//  */
// -(struct GPKGBoundingBoxSize) sizeInMeters;
