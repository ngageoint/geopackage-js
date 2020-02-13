import { Type } from './abstract';
export declare class InferredType extends Type {
    name: string;
    readonly type: string;
    constructor(name: string);
    clone(): Type;
    equals(type: unknown): boolean;
    toObject(): any;
    toString(): string;
}
