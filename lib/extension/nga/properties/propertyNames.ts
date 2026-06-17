/**
 * Pre-defined property names for defining GeoPackage properties
 */
export class PropertyNames {
  /**
   * An entity responsible for making contributions to the resource
   */
  public static readonly CONTRIBUTOR: string = 'contributor';

  /**
   * The spatial or temporal topic of the resource, the spatial applicability
   * of the resource, or the jurisdiction under which the resource is relevant
   */
  public static readonly COVERAGE: string = 'coverage';

  /**
   * Date Created - Date of creation of the resource
   */
  public static readonly CREATED: string = 'created';

  /**
   * An entity primarily responsible for making the resource
   */
  public static readonly CREATOR: string = 'creator';

  /**
   * A point or period of time associated with an event in the lifecycle of
   * the resource
   */
  public static readonly DATE: string = 'date';

  /**
   * An account of the resource
   */
  public static readonly DESCRIPTION: string = 'description';

  /**
   * An unambiguous reference to the resource within a given context
   */
  public static readonly IDENTIFIER: string = 'identifier';

  /**
   * A legal document giving official permission to do something with the
   * resource
   */
  public static readonly LICENSE: string = 'license';

  /**
   * Date Modified - Date on which the resource was changed
   */
  public static readonly MODIFIED: string = 'modified';

  /**
   * An entity responsible for making the resource available
   */
  public static readonly PUBLISHER: string = 'publisher';

  /**
   * A related resource that is referenced, cited, or otherwise pointed to by
   * the described resource
   */
  public static readonly REFERENCES: string = 'references';

  /**
   * A related resource
   */
  public static readonly RELATION: string = 'relation';

  /**
   * A related resource from which the described resource is derived
   */
  public static readonly SOURCE: string = 'source';

  /**
   * Spatial Coverage - Spatial characteristics of the resource
   */
  public static readonly SPATIAL: string = 'spatial';

  /**
   * The topic of the resource
   */
  public static readonly SUBJECT: string = 'subject';

  /**
   * A tag or label of the resource
   */
  public static readonly TAG: string = 'tag';

  /**
   * Temporal Coverage - Temporal characteristics of the resource
   */
  public static readonly TEMPORAL = 'temporal';

  /**
   * A name given to the resource
   */
  public static readonly TITLE = 'title';

  /**
   * The nature or genre of the resource
   */
  public static readonly TYPE = 'type';

  /**
   * The set of identifiers constructed according to the generic syntax for
   * Uniform Resource Identifiers as specified by the Internet Engineering
   * Task Force
   */
  public static readonly URI = 'URI';

  /**
   * Date Valid - Date (often a range) of validity of a resource
   */
  public static readonly VALID = 'valid';

  /**
   * A version of the resource
   */
  public static readonly VERSION = 'version';
}
