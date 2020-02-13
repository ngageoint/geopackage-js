"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const declared = [];
function addDecoratedOptions(options) {
    options.addDeclarations(declared);
}
exports.addDecoratedOptions = addDecoratedOptions;
function Option(option) {
    declared.push(option);
    return function (target, key) {
        Object.defineProperty(target, key, {
            get() {
                if ('options' in this) {
                    return this.options.getValue(option.name);
                }
                else {
                    return this.application.options.getValue(option.name);
                }
            },
            enumerable: true,
            configurable: true
        });
    };
}
exports.Option = Option;
//# sourceMappingURL=decorator.js.map