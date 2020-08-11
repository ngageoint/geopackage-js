export enum ContentsDataType {
  FEATURES = 'features',
  TILES = 'tiles',
  ATTRIBUTES = 'attributes'
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ContentsDataType {
  export function nameFromType(type: ContentsDataType): string {
    return ContentsDataType[type];
  }

  export function fromName(type: string): ContentsDataType {
    let dataType = null;
    if (type !== null && type !== undefined) {
      switch (type.toLowerCase()) {
        case ContentsDataType.FEATURES:
          dataType = ContentsDataType.FEATURES;
          break;
        case ContentsDataType.TILES:
          dataType = ContentsDataType.TILES;
          break;
        case ContentsDataType.ATTRIBUTES:
          dataType = ContentsDataType.ATTRIBUTES;
          break;
        default:
          break;
      }
    }
    return dataType;
  }
}
