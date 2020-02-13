"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("@turf/helpers");
var invariant_1 = require("@turf/invariant");
var martinez = __importStar(require("martinez-polygon-clipping"));
/**
 * Takes two {@link Polygon|polygon} or {@link MultiPolygon|multi-polygon} geometries and
 * finds their polygonal intersection. If they don't intersect, returns null.
 *
 * @name intersect
 * @param {Feature<Polygon | MultiPolygon>} poly1 the first polygon or multipolygon
 * @param {Feature<Polygon | MultiPolygon>} poly2 the second polygon or multipolygon
 * @param {Object} [options={}] Optional Parameters
 * @param {Object} [options.properties={}] Translate GeoJSON Properties to Feature
 * @returns {Feature|null} returns a feature representing the area they share (either a {@link Polygon} or
 * {@link MultiPolygon}). If they do not share any area, returns `null`.
 * @example
 * var poly1 = turf.polygon([[
 *   [-122.801742, 45.48565],
 *   [-122.801742, 45.60491],
 *   [-122.584762, 45.60491],
 *   [-122.584762, 45.48565],
 *   [-122.801742, 45.48565]
 * ]]);
 *
 * var poly2 = turf.polygon([[
 *   [-122.520217, 45.535693],
 *   [-122.64038, 45.553967],
 *   [-122.720031, 45.526554],
 *   [-122.669906, 45.507309],
 *   [-122.723464, 45.446643],
 *   [-122.532577, 45.408574],
 *   [-122.487258, 45.477466],
 *   [-122.520217, 45.535693]
 * ]]);
 *
 * var intersection = turf.intersect(poly1, poly2);
 *
 * //addToMap
 * var addToMap = [poly1, poly2, intersection];
 */
function intersect(poly1, poly2, options) {
    if (options === void 0) { options = {}; }
    var geom1 = invariant_1.getGeom(poly1);
    var geom2 = invariant_1.getGeom(poly2);
    if (geom1.type === "Polygon" && geom2.type === "Polygon") {
        var intersection = martinez.intersection(geom1.coordinates, geom2.coordinates);
        if (intersection === null || intersection.length === 0) {
            return null;
        }
        if (intersection.length === 1) {
            var start = intersection[0][0][0];
            var end = intersection[0][0][intersection[0][0].length - 1];
            if (start[0] === end[0] && start[1] === end[1]) {
                return helpers_1.polygon(intersection[0], options.properties);
            }
            return null;
        }
        return helpers_1.multiPolygon(intersection, options.properties);
    }
    else if (geom1.type === "MultiPolygon") {
        var resultCoords = [];
        // iterate through the polygon and run intersect with each part, adding to the resultCoords.
        for (var _i = 0, _a = geom1.coordinates; _i < _a.length; _i++) {
            var coords = _a[_i];
            var subGeom = invariant_1.getGeom(helpers_1.polygon(coords));
            var subIntersection = intersect(subGeom, geom2);
            if (subIntersection) {
                var subIntGeom = invariant_1.getGeom(subIntersection);
                if (subIntGeom.type === "Polygon") {
                    resultCoords.push(subIntGeom.coordinates);
                }
                else if (subIntGeom.type === "MultiPolygon") {
                    resultCoords = resultCoords.concat(subIntGeom.coordinates);
                }
                else {
                    throw new Error("intersection is invalid");
                }
            }
        }
        // Make a polygon with the result
        if (resultCoords.length === 0) {
            return null;
        }
        if (resultCoords.length === 1) {
            return helpers_1.polygon(resultCoords[0], options.properties);
        }
        else {
            return helpers_1.multiPolygon(resultCoords, options.properties);
        }
    }
    else if (geom2.type === "MultiPolygon") {
        // geom1 is a polygon and geom2 a multiPolygon,
        // put the multiPolygon first and fallback to the previous case.
        return intersect(geom2, geom1);
    }
    else {
        // handle invalid geometry types
        throw new Error("poly1 and poly2 must be either polygons or multiPolygons");
    }
}
exports.default = intersect;
