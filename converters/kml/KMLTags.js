/**
 * Subset of Tags that a KML File can have.
 * Defined as const to prevent spelling/capitalization issues.
 */

export const PLACEMARK_TAG = 'Placemark';

// Placemarks can these tags as Geometries
export const GEOMETRY_TAGS = {
  POINT: 'Point',
  LINESTRING: 'LineString',
  POLYGON: 'Polygon',
  MULTIGEOMETRY: 'MultiGeometry',
};

export const COORDINATES_TAG = 'coordinates';

export const STYLE_TAG = 'Style';

export const STYLE_URL_TAG = 'styleUrl';

export const STYLE_MAP_TAG = 'StyleMap';

export const STYLE_TYPES = {
  ICON_STYLE: 'IconStyle',
  LINE_STYLE: 'LineStyle',
  POLY_STYLE: 'PolyStyle',
};

export const ICON_TAG = 'Icon';

export const DOCUMENT_TAG = 'Document';

export const PAIR_TAG = 'Pair';

export const GROUND_OVERLAY_TAG = 'GroundOverlay';
