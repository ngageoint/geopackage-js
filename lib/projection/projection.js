

var Projection = function(epsg, crs, toMeters) {
  this.epsg = epsg;
  this.crs = crs;
  this.toMeters = toMeters;
  //self.isLatLong = pj_is_latlong(crs);
}

module.exports = Projection;

Projection.prototype.toMeters = function (value) {
  if (this.toMeters) {
    return this.toMeters(value);
  }
  return value;
}
