/**
 * Tile grid with x and y ranges
 * @module tiles/tileGrid
 * @class
 */
export declare class TileGrid {
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
    constructor(min_x: number, max_x: number, min_y: number, max_y: number);
    count(): number;
    equals(tileGrid: TileGrid): boolean;
}
