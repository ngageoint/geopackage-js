var wkx = require('wkx');
var turfBbox = require('@turf/bbox');

module.exports.buildEnvelopeWithGeometry = function(wkbGeometry) {
  var geoJson = wkbGeometry.toGeoJSON();
  var bbox = turfBbox(geoJson);
  return {
    minX: bbox[0],
    minY: bbox[1],
    maxX: bbox[2],
    maxY: bbox[3]
  };
}

module.exports.expandEnvelopeForGeometry = function(envelope, wkbGeometry) {

}
