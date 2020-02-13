"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
/**
 * Converts a {@link Polygon} to {@link LineString|(Multi)LineString} or {@link MultiPolygon} to a
 * {@link FeatureCollection} of {@link LineString|(Multi)LineString}.
 *
 * @name polygonToLine
 * @param {Feature<Polygon|MultiPolygon>} poly Feature to convert
 * @param {Object} [options={}] Optional parameters
 * @param {Object} [options.properties={}] translates GeoJSON properties to Feature
 * @returns {FeatureCollection|Feature<LineString|MultiLinestring>} converted (Multi)Polygon to (Multi)LineString
 * @example
 * var poly = turf.polygon([[[125, -30], [145, -30], [145, -20], [125, -20], [125, -30]]]);
 *
 * var line = turf.polygonToLine(poly);
 *
 * //addToMap
 * var addToMap = [line];
 */
function default_1(poly, options) {
    if (options === void 0) { options = {}; }
    var geom = invariant_1.getGeom(poly);
    if (!options.properties && poly.type === "Feature") {
        options.properties = poly.properties;
    }
    switch (geom.type) {
        case "Polygon": return polygonToLine(geom, options);
        case "MultiPolygon": return multiPolygonToLine(geom, options);
        default: throw new Error("invalid poly");
    }
}
exports.default = default_1;
/**
 * @private
 */
function polygonToLine(poly, options) {
    if (options === void 0) { options = {}; }
    var geom = invariant_1.getGeom(poly);
    var type = geom.type;
    var coords = geom.coordinates;
    var properties = options.properties ? options.properties : poly.type === "Feature" ? poly.properties : {};
    return coordsToLine(coords, properties);
}
exports.polygonToLine = polygonToLine;
/**
 * @private
 */
function multiPolygonToLine(multiPoly, options) {
    if (options === void 0) { options = {}; }
    var geom = invariant_1.getGeom(multiPoly);
    var type = geom.type;
    var coords = geom.coordinates;
    var properties = options.properties ? options.properties :
        multiPoly.type === "Feature" ? multiPoly.properties : {};
    var lines = [];
    coords.forEach(function (coord) {
        lines.push(coordsToLine(coord, properties));
    });
    return helpers_1.featureCollection(lines);
}
exports.multiPolygonToLine = multiPolygonToLine;
/**
 * @private
 */
function coordsToLine(coords, properties) {
    if (coords.length > 1) {
        return helpers_1.multiLineString(coords, properties);
    }
    return helpers_1.lineString(coords[0], properties);
}
exports.coordsToLine = coordsToLine;
