export enum DataTypes {
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
  GEOMETRY,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DataTypes {
  export function nameFromType(type: DataTypes): string {
    return DataTypes[type];
  }

  export function fromName(type: string): DataTypes {
    return DataTypes[type as keyof typeof DataTypes] as DataTypes;
  }
}
