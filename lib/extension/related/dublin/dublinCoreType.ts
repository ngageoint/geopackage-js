/**
 * @module  extension/relatedTables
 */

/**
 * Dublin Core Metadata Initiative term types
 * @class
 */
export class DublinCoreType {
  /**
   * A point or period of time associated with an event in the lifecycle of
   * the resource.
   * @type {Object}
   */
  public static readonly DATE: DublinCoreType = new DublinCoreType('date');

  /**
   * An account of the resource.
   * @type {Object}
   */
  public static readonly DESCRIPTION: DublinCoreType = new DublinCoreType('description');

  /**
   * The file format, physical medium, or dimensions of the resource.
   * @type {Object}
   */
  public static readonly FORMAT: DublinCoreType = new DublinCoreType('format', ['content_type']);

  /**
   * An unambiguous reference to the resource within a given context.
   * @type {Object}
   */
  public static readonly IDENTIFIER: DublinCoreType = new DublinCoreType('identifier', ['id']);

  /**
   * A related resource from which the described resource is derived.
   * @type {Object}
   */
  public static readonly SOURCE: DublinCoreType = new DublinCoreType('source');

  /**
   * A name given to the resource.
   * @type {Object}
   */
  public static readonly TITLE: DublinCoreType = new DublinCoreType('title');

  constructor(public name: string, public synonyms: string[] = []) {}

  public getName(): string {
    return this.name;
  }

  public getSynonyms(): string[] {
    return this.synonyms;
  }

  /**
   * Returns a list of all dublin core types
   */
  public static getTypes(): DublinCoreType[] {
    return [DublinCoreType.DATE, DublinCoreType.DESCRIPTION, DublinCoreType.FORMAT, DublinCoreType.IDENTIFIER, DublinCoreType.SOURCE, DublinCoreType.TITLE];
  }

  /**
   * Get the Dublin Core Type from the name
   * @param  {string} name name
   * @return {module:extension/relatedTables~DublinCoreType}
   */
  public static fromName(name: string): DublinCoreType {
    let dublinCoreType = null;
    for (const type of DublinCoreType.getTypes()) {
      if (type.getName() === name.toLowerCase()) {
        dublinCoreType = type;
        break;
      }
      for (const synonym of type.getSynonyms()) {
        if (synonym === name.toLowerCase()) {
          dublinCoreType = type;
          break;
        }
      }
      if (dublinCoreType != null) {
        break;
      }
    }
    return dublinCoreType;
  }
}
