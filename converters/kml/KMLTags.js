/**
 * Subset of Tags that a KML File can have.
 * Defined as const to prevent spelling/capitalization issues.
 */

/**
 * Placemark tags define are geometric features in KML
 */
export const PLACEMARK_TAG = 'Placemark';

/**
 * Placemarks Tags can have one of these tags.
 * All are derived from the abstract geometry tag.
 */
export const GEOMETRY_TAGS = {
  POINT: 'Point',
  LINESTRING: 'LineString',
  POLYGON: 'Polygon',
  MULTIGEOMETRY: 'MultiGeometry',
  MODEL: 'Model',
};

/**
 * Polygon Tags have one outer boundary.
 */
export const OUTER_BOUNDARY_TAG = 'outerBoundaryIs';

/**
 * Polygon Tags have multiple inner boundary.
 */
export const INNER_BOUNDARY_TAG = 'innerBoundaryIs';

/**
 * Defines where a point is.
 */
export const COORDINATES_TAG = 'coordinates';

/**
 * Define how a style looks like
 */
export const STYLE_TAG = 'Style';

/**
 * Defines which style to use
 */
export const STYLE_URL_TAG = 'styleUrl';

/**
 * Defines two state highlighted and not highlighted
 * Each state has a styleUrl pointing the style they should be.
 */
export const STYLE_MAP_TAG = 'StyleMap';

/**
 * Within Style tags these defined how different parts of the geometry should look like.
 */
export const STYLE_TYPES = {
  ICON_STYLE: 'IconStyle',
  LINE_STYLE: 'LineStyle',
  POLY_STYLE: 'PolyStyle',
};

export const ICON_TAG = 'Icon';

export const HOTSPOT_TAG = 'hotSpot';

export const SCALE_TAG = 'scale';

export const DOCUMENT_TAG = 'Document';

export const PAIR_TAG = 'Pair';

export const GROUND_OVERLAY_TAG = 'GroundOverlay';

export const ALTITUDE_MODE_TAG = 'altitudeMode';

/**
 * Test/WIP: A href (url) to a separate KML file that is added as part of the current KML.
 * Used to provide dynamic data into the KML.
 */
export const NETWORK_LINK = 'NetworkLink';

export const ITEM_TO_SEARCH_WITHIN = [GEOMETRY_TAGS.LINESTRING, GEOMETRY_TAGS.POINT, GEOMETRY_TAGS.POLYGON];

export const INNER_ITEMS_TO_IGNORE = [COORDINATES_TAG, OUTER_BOUNDARY_TAG, INNER_BOUNDARY_TAG];
