/**
 * Subset of Tags that a KML File can have.
 * Defined as const to prevent spelling/capitalization issues.
 */

/**
 * ### A Placemark is a Feature with an associated Geometry.
 * In Google Earth, a Placemark appears as a list item in the Places panel.
 * A Placemark with a Point has an icon associated with it that marks a point on the Earth in the 3D viewer.
 * (In the Google Earth 3D viewer, a Point Placemark is the only object you can click or roll over.
 *  Other Geometry objects do not have an icon in the 3D viewer.
 *  To give the user something to click in the 3D viewer, you would need to create a MultiGeometry object that contains both a Point and the other Geometry object.)
 *
 * https://developers.google.com/kml/documentation/kmlreference#placemark
 */
export const PLACEMARK_TAG = 'Placemark';

/**
 * Placemarks Tags can have one of these tags.
 * Geometry tag is an abstract element and cannot be used directly in a KML file.
 * It provides a placeholder object for all derived Geometry objects.
 *
 * https://developers.google.com/kml/documentation/kmlreference#geometry
 */
export const GEOMETRY_TAGS = {
  /**
   * ### A geographic location defined by longitude, latitude, and (optional) altitude.
   * When a Point is contained by a Placemark, the point itself determines the position of the Placemark's name and icon.
   * When a Point is extruded, it is connected to the ground with a line. This "tether" uses the current LineStyle.
   *
   * https://developers.google.com/kml/documentation/kmlreference#point
   */
  POINT: 'Point',
  /**
   * ### Defines a connected set of line segments.
   * Use <LineStyle> to specify the color, color mode, and width of the line.
   * When a LineString is extruded, the line is extended to the ground, forming a polygon that looks somewhat like a wall or fence.
   * For extruded LineStrings, the line itself uses the current LineStyle, and the extrusion uses the current PolyStyle. See the KML Tutorial for examples of LineStrings (or paths).
   *
   * https://developers.google.com/kml/documentation/kmlreference#linestring
   */
  LINESTRING: 'LineString',
  /**
   * ### A Polygon is defined by an outer boundary and 0 or more inner boundaries.
   * The boundaries, in turn, are defined by LinearRings. When a Polygon is extruded, its boundaries are connected to the ground to form additional polygons, which gives the appearance of a building or a box.
   * Extruded Polygons use <PolyStyle> for their color, color mode, and fill.
   *
   * The <coordinates> for polygons must be specified in counterclockwise order.
   * Polygons follow the "right-hand rule," which states that if you place the fingers of your right hand in the direction in which the coordinates are specified, your thumb points in the general direction of the geometric normal for the polygon.
   * (In 3D graphics, the geometric normal is used for lighting and points away from the front face of the polygon.)
   * Since Google Earth fills only the front face of polygons, you will achieve the desired effect only when the coordinates are specified in the proper order.
   * Otherwise, the polygon will be gray.
   *
   * https://developers.google.com/kml/documentation/kmlreference#polygon
   */
  POLYGON: 'Polygon',
  /**
   * ### A container for zero or more geometry primitives associated with the same feature.
   *
   * https://developers.google.com/kml/documentation/kmlreference#multigeometry
   */
  MULTIGEOMETRY: 'MultiGeometry',
  /**
   * Currently Not Supported
   */
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
 * ### A Style defines an addressable style group
 *
 * that can be referenced by StyleMaps and Features.
 * Styles affect how Geometry is presented in the 3D viewer and how Features appear in the Places panel of the List view.
 * Shared styles are collected in a <Document> and must have an id defined for them so that they can be referenced by the individual Features that use them.
 *
 * Use an id to refer to the style from a <styleUrl>.
 *
 * https://developers.google.com/kml/documentation/kmlreference#style
 */
export const STYLE_TAG = 'Style';

/**
 * ### URL of a <Style> or <StyleMap> defined in a Document.
 *
 * If the style is in the same file, use a # reference.
 *
 * If the style is defined in an external file, use a full URL along with # referencing
 *
 * https://developers.google.com/kml/documentation/kmlreference#styleurl
 */
export const STYLE_URL_TAG = 'styleUrl';

/**
 * ### A <StyleMap> maps between two different Styles.
 *
 * Typically a <StyleMap> element is used to provide separate normal and highlighted styles for a placemark, so that the highlighted version appears when the user mouses over the icon in Google Earth.
 *
 * https://developers.google.com/kml/documentation/kmlreference#stylemap
 */
export const STYLE_MAP_TAG = 'StyleMap';

/**
 * Within Style tags these defined how different parts of the geometry should look like.
 */
export const STYLE_TYPES = {
  /**
   * ### Specifies how icons for point Placemarks are drawn,
   *
   * both in the Places panel and in the 3D viewer of Google Earth.
   * The <Icon> element specifies the icon image. The <scale> element specifies the x, y scaling of the icon.
   * The color specified in the <color> element of <IconStyle> is blended with the color of the <Icon>.
   *
   * https://developers.google.com/kml/documentation/kmlreference#iconstyle
   */
  ICON_STYLE: 'IconStyle',
  /**
   * ### Specifies the drawing style (color, color mode, and line width) for all line geometry.
   *
   * Line geometry includes the outlines of outlined polygons and the extruded "tether" of Placemark icons (if extrusion is enabled).
   *
   * https://developers.google.com/kml/documentation/kmlreference#linestyle
   */
  LINE_STYLE: 'LineStyle',
  /**
   * ### Specifies the drawing style for all polygons
   *
   * including polygon extrusions (which look like the walls of buildings) and line extrusions (which look like solid fences).
   *
   * https://developers.google.com/kml/documentation/kmlreference#polystyle
   */
  POLY_STYLE: 'PolyStyle',
};

/**
 * ### Defines an image associated with an Icon style or overlay.
 *
 * The required <href> child element defines the location of the image to be used as the overlay or as the icon for the placemark.
 * This location can either be on a local file system or a remote web server.
 *
 * https://developers.google.com/kml/documentation/kmlreference#icon
 */
export const ICON_TAG = 'Icon';

/**
 * The <gx:x>, <gx:y>, <gx:w>, and <gx:h> elements are used to select one icon from an image that contains multiple icons (often referred to as an icon palette.
 */
export const ICON_SELECTOR = {
  /**
   * If the <href> specifies an icon palette, these elements identify the offsets, in pixels, from the lower-left corner of the icon palette.If no values are specified for x and y, the lower left corner of the icon palette is assumed to be the lower-left corner of the icon to use.
   */
  X_POSITION: 'gx:x',
  /**
   * If the <href> specifies an icon palette, these elements identify the offsets, in pixels, from the lower-left corner of the icon palette.If no values are specified for x and y, the lower left corner of the icon palette is assumed to be the lower-left corner of the icon to use.
   */
  Y_POSITION: 'gx:y',
  /**
   * If the <href> specifies an icon palette, these elements specify the width (<gx:w>) and height (<gx:h>), in pixels, of the icon to use.
   */
  WIDTH: 'gx:w',
  /**
   * If the <href> specifies an icon palette, these elements specify the width (<gx:w>) and height (<gx:h>), in pixels, of the icon to use.
   */
  HEIGHT: 'gx:h',
};

/**
 * Specifies the position within the Icon that is "anchored" to the <Point> specified in the Placemark. The x and y values can be specified in three different ways: as pixels ("pixels"), as fractions of the icon ("fraction"), or as inset pixels ("insetPixels"), which is an offset in pixels from the upper right corner of the icon. The x and y positions can be specified in different ways—for example, x can be in pixels and y can be a fraction. The origin of the coordinate system is in the lower left corner of the icon.
 */
export const HOTSPOT_TAG = 'hotSpot';

/**
 * Define the location of the Icon's anchor
 */
export const HOTSPOT_TAG_DESCRIPTORS = {
  /**
   * xunits - Units in which the x value is specified. A value of fraction indicates the x value is a fraction of the icon. A value of pixels indicates the x value in pixels. A value of insetPixels indicates the indent from the right edge of the icon.
   */
  X_UNITS_DESCRIPTOR: 'xunits',
  /**
   * yunits - Units in which the y value is specified. A value of fraction indicates the y value is a fraction of the icon. A value of pixels indicates the y value in pixels. A value of insetPixels indicates the indent from the top edge of the icon.
   */
  Y_UNITS_DESCRIPTOR: 'yunits',
  /**
   * x - Either the number of pixels, a fractional component of the icon, or a pixel inset indicating the x component of a point on the icon.
   */
  X_COMPONENT_DESCRIPTOR: 'x',
  /**
   * y - Either the number of pixels, a fractional component of the icon, or a pixel inset indicating the y component of a point on the icon.
   */
  Y_COMPONENT_DESCRIPTOR: 'y',
};

/**
 * Resizes the icon.
 */
export const SCALE_TAG = 'scale';

/**
 * ### A Document is a container for features and styles.
 *
 * This element is required if your KML file uses shared styles. It is recommended that you use shared styles, which require the following steps:
 * Define all Styles in a Document. Assign a unique ID to each Style.
 * Within a given Feature or StyleMap, reference the Style's ID using a <styleUrl> element.
 * Note that shared styles are not inherited by the Features in the Document.
 * Each Feature must explicitly reference the styles it uses in a <styleUrl> element.
 * For a Style that applies to a Document (such as ListStyle), the Document itself must explicitly reference the <styleUrl>.
 *
 * https://developers.google.com/kml/documentation/kmlreference#document
 */
export const DOCUMENT_TAG = 'Document';

/**
 * Defines a key/value pair that maps a mode (normal or highlight) to the predefined <styleUrl>. <Pair> contains two elements (both are required):
 *
 * <key>, which identifies the key
 *
 * <styleUrl> or <Style>, which references the style. In <styleUrl>, for referenced style elements that are local to the KML document, a simple # referencing is used. For styles that are contained in external files, use a full URL along with # referencing.
 */
export const PAIR_TAG = 'Pair';

/**
 * Defines Pair Tags Mode (normal or highlight)
 */
export const KEY_TAG = 'key';

/**
 * This element draws an image overlay draped onto the terrain.
 *
 * The <href> child of <Icon> specifies the image to be used as the overlay.
 * This file can be either on a local file system or on a web server.
 * If this element is omitted or contains no <href>, a rectangle is drawn using the color and LatLonBox bounds defined by the ground overlay.
 *
 * https://developers.google.com/kml/documentation/kmlreference#geometry
 */
export const GROUND_OVERLAY_TAG = 'GroundOverlay';

/**
 * How linestring or polygons work.
 */
export const ALTITUDE_MODE_TAG = 'altitudeMode';

/**
 * Test/WIP: A href (url) to a separate KML file that is added as part of the current KML.
 * Used to provide dynamic data into the KML.
 */
export const NETWORK_LINK = 'NetworkLink';

export const ITEM_TO_SEARCH_WITHIN = [GEOMETRY_TAGS.LINESTRING, GEOMETRY_TAGS.POINT, GEOMETRY_TAGS.POLYGON];

export const INNER_ITEMS_TO_IGNORE = [COORDINATES_TAG, OUTER_BOUNDARY_TAG, INNER_BOUNDARY_TAG];
