import { TypeDocOptionMap, KeyToDeclaration } from '../declaration';
import { Options } from '..';
import { Application } from '../../../application';
export declare function addDecoratedOptions(options: Options): void;
export declare function Option<K extends keyof TypeDocOptionMap>(option: {
    name: K;
} & KeyToDeclaration<K>): (target: {
    application: Application;
} | {
    options: Options;
}, key: string | number | symbol) => void;
