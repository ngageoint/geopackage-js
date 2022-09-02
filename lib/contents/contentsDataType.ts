import { GeoPackageException } from '../geoPackageException';

export enum ContentsDataType {
  FEATURES = 'features',
  TILES = 'tiles',
  ATTRIBUTES = 'attributes',
}

const coreTypes = {
  features: ContentsDataType.FEATURES,
  tiles: ContentsDataType.TILES,
  attributes: ContentsDataType.ATTRIBUTES,
};
const types = {
  features: ContentsDataType.FEATURES,
  tiles: ContentsDataType.TILES,
  attributes: ContentsDataType.ATTRIBUTES,
  '2d-gridded-coverage': ContentsDataType.TILES,
  'vector-tiles': ContentsDataType.TILES,
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ContentsDataType {
  export function nameFromType(type: ContentsDataType): string {
    return ContentsDataType[type];
  }

  /**
   * Get the Data Type from the name
   *
   * @param name
   *            contents data type name
   * @return contents data type or null
   */
  export function fromName(name: string): ContentsDataType {
    let dataType = null;
    if (name != null) {
      const lowerName = name.toLowerCase();
      dataType = types[lowerName];
    }
    return dataType;
  }

  /**
   * Determine if the type name is a registered data type
   *
   * @param name type name
   * @return true if a core contents data type
   */
  export function isTypeRegistered(name: string): boolean {
    return ContentsDataType.fromName(name) != null;
  }

  /**
   * Get the contents data type from a core type name
   *
   * @param name
   *            type name
   * @return contents data type if core, null if not
   */
  export function fromCoreName(name: string): ContentsDataType {
    let dataType = null;
    if (ContentsDataType.isCoreType(name)) {
      dataType = types[name.toLowerCase()];
    }
    return dataType;
  }

  /**
   * Determine if the type name is a core contents data type
   *
   * @param name
   *            type name
   * @return true if a core contents data type
   */
  export function isCoreType(name: string): boolean {
    return name != null && coreTypes[name.toLowerCase()] != null;
  }

  /**
   * Set the type for the contents data type name
   * @param name contents data type name
   * @param type contents data type
   */
  export function setType(name: string, type: ContentsDataType): void {
    if (name != null) {
      const lowerName = name.toLowerCase();
      const dataType = types[lowerName];

      if (dataType == null) {
        types[lowerName] = type;
      } else if (dataType != type) {
        if (coreTypes[lowerName] == null) {
          throw new GeoPackageException(
            "Core contents data type name '" +
              name +
              "' can not be changed to type '" +
              ContentsDataType.nameFromType(type) +
              "'",
          );
        }

        console.warn(
          "Changed contents data type name '" +
            name +
            "' from type '" +
            dataType.getName() +
            "' to type '" +
            ContentsDataType.nameFromType(type) +
            "'",
        );

        types[lowerName] = type;
      }
    }
  }

  /**
   * Determine if the contents data type name is the type
   *
   * @param name
   *            contents data type name
   * @param type
   *            comparison contents data type
   * @param matchUnknown
   *            true to match unknown data types
   * @return true if matching core types or matched unknown
   */
  export function isType(name: string, type: ContentsDataType, matchUnknown = false): boolean {
    let isType;
    const dataType = ContentsDataType.fromName(name);
    if (dataType != null) {
      isType = dataType == type;
    } else {
      isType = matchUnknown;
    }
    return isType;
  }

  /**
   * Determine if the contents data type name is a features type
   *
   * @param name
   *            contents data type name
   * @param matchUnknown
   *            true to match unknown data types
   * @return true if a features type or matched unknown
   */
  export function isFeaturesType(name: string, matchUnknown = false): boolean {
    return ContentsDataType.isType(name, ContentsDataType.FEATURES, matchUnknown);
  }

  /**
   * Determine if the contents data type name is a tiles type
   *
   * @param name
   *            contents data type name
   * @param matchUnknown
   *            true to match unknown data types
   * @return true if a tiles type or matched unknown
   */
  export function isTilesType(name: string, matchUnknown = false): boolean {
    return ContentsDataType.isType(name, ContentsDataType.TILES, matchUnknown);
  }

  /**
   * Determine if the contents data type name is an attributes type
   *
   * @param name
   *            contents data type name
   * @param matchUnknown
   *            true to match unknown data types
   * @return true if an attributes type or matched unknown
   */
  export function isAttributesType(name: string, matchUnknown = false): boolean {
    return ContentsDataType.isType(name, ContentsDataType.ATTRIBUTES, matchUnknown);
  }
}
