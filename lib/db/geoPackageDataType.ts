export enum GeoPackageDataType {
  BOOLEAN,
  TINYINT,
  SMALLINT,
  MEDIUMINT,
  INT,
  INTEGER,
  FLOAT,
  DOUBLE,
  REAL,
  TEXT,
  BLOB,
  DATE,
  DATETIME,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GeoPackageDataType {
  export function nameFromType(type: GeoPackageDataType): string {
    return GeoPackageDataType[type];
  }

  export function fromName(type: string): GeoPackageDataType {
    return GeoPackageDataType[type as keyof typeof GeoPackageDataType] as GeoPackageDataType;
  }

  /**
   * Gets string name of class associated with GeoPackageDataType represented in the database.
   * @param type
   */
  export function getClass(type: GeoPackageDataType): string {
    let clazz;
    switch (type) {
      case GeoPackageDataType.BOOLEAN:
      case GeoPackageDataType.TINYINT:
      case GeoPackageDataType.SMALLINT:
      case GeoPackageDataType.MEDIUMINT:
      case GeoPackageDataType.INT:
      case GeoPackageDataType.INTEGER:
      case GeoPackageDataType.FLOAT:
      case GeoPackageDataType.DOUBLE:
      case GeoPackageDataType.REAL:
        clazz = 'number';
        break;
      case GeoPackageDataType.TEXT:
        clazz = 'string';
        break;
      case GeoPackageDataType.BLOB:
        clazz = 'Buffer';
        break;
      case GeoPackageDataType.DATE:
        clazz = 'Date';
        break;
      case GeoPackageDataType.DATETIME:
        clazz = 'Date';
        break;
      default:
        break;
    }
    return clazz;
  }

  /**
   * Get the column default value as a string
   * @param defaultValue default value
   * @param dataType data type
   * @return default value
   */
  export function columnDefaultValue(defaultValue: any, dataType: GeoPackageDataType): string {
    let value = null;

    if (defaultValue !== null && defaultValue !== undefined) {
      if (dataType !== null && dataType !== undefined) {
        switch (dataType) {
          case GeoPackageDataType.BOOLEAN:
            let booleanValue = null;
            if (typeof defaultValue === 'boolean') {
              booleanValue = defaultValue;
            } else if (typeof defaultValue === 'string') {
              switch (defaultValue) {
                case '0':
                  booleanValue = false;
                  break;
                case '1':
                  booleanValue = true;
                  break;
                case 'true':
                  booleanValue = true;
                  break;
                case 'false':
                  booleanValue = false;
                  break;
                default:
                  break;
              }
            }
            if (booleanValue !== null && booleanValue !== undefined) {
              if (booleanValue) {
                value = '1';
              } else {
                value = '0';
              }
            }
            break;
          case GeoPackageDataType.TEXT:
            value = defaultValue.toString();
            if (!value.startsWith("'") || !value.endsWith("'")) {
              value = "'" + value + "'";
            }
            break;
          default:
        }
      }

      if (value === null || value === undefined) {
        value = defaultValue.toString();
      }
    }
    return value;
  }
}
