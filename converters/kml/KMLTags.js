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
  MODEL: 'Model',
};
export const OUTER_BOUNDARY_TAG = 'outerBoundaryIs';

export const INNER_BOUNDARY_TAG = 'innerBoundaryIs';

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

export const ALTITUDE_MODE_TAG = 'altitudeMode';

export const SCALE_TAG = 'scale';

export const HOTSPOT_TAG = 'hotSpot';

export const ITEM_TO_SEARCH_WITHIN = [GEOMETRY_TAGS.LINESTRING, GEOMETRY_TAGS.POINT, GEOMETRY_TAGS.POLYGON];

export const INNER_ITEMS_TO_IGNORE = [COORDINATES_TAG, OUTER_BOUNDARY_TAG, INNER_BOUNDARY_TAG];
