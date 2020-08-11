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
}
