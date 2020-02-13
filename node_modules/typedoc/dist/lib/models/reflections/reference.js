"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const abstract_1 = require("./abstract");
const declaration_1 = require("./declaration");
var ReferenceState;
(function (ReferenceState) {
    ReferenceState[ReferenceState["Unresolved"] = 0] = "Unresolved";
    ReferenceState[ReferenceState["Resolved"] = 1] = "Resolved";
})(ReferenceState = exports.ReferenceState || (exports.ReferenceState = {}));
class ReferenceReflection extends declaration_1.DeclarationReflection {
    constructor(name, state, parent) {
        super(name, abstract_1.ReflectionKind.Reference, parent);
        this.flags.setFlag(abstract_1.ReflectionFlag.Exported, true);
        this._state = state;
    }
    get isReference() {
        return true;
    }
    tryGetTargetReflection() {
        this._ensureProject();
        this._ensureResolved(false);
        return this._state[0] === ReferenceState.Resolved ? this._project.reflections[this._state[1]] : undefined;
    }
    tryGetTargetReflectionDeep() {
        let result = this.tryGetTargetReflection();
        while (result instanceof ReferenceReflection) {
            result = result.tryGetTargetReflection();
        }
        return result;
    }
    getTargetReflection() {
        this._ensureProject();
        this._ensureResolved(true);
        return this._project.reflections[this._state[1]];
    }
    getTargetReflectionDeep() {
        let result = this.getTargetReflection();
        while (result instanceof ReferenceReflection) {
            result = result.getTargetReflection();
        }
        return result;
    }
    toObject() {
        var _a, _b;
        return Object.assign(Object.assign({}, super.toObject()), { target: (_b = (_a = this.tryGetTargetReflection()) === null || _a === void 0 ? void 0 : _a.id, (_b !== null && _b !== void 0 ? _b : -1)) });
    }
    _ensureResolved(throwIfFail) {
        if (this._state[0] === ReferenceState.Unresolved) {
            const target = this._project.symbolMapping[this._state[1]];
            if (!target) {
                if (throwIfFail) {
                    throw new Error(`Tried to reference reflection for ${this.name} that does not exist.`);
                }
                return;
            }
            this._state = [ReferenceState.Resolved, target];
        }
    }
    _ensureProject() {
        if (this._project) {
            return;
        }
        let project = this.parent;
        while (project && !project.isProject()) {
            project = project.parent;
        }
        this._project = project;
        if (!this._project) {
            throw new Error('Reference reflection has no project and is unable to resolve.');
        }
    }
}
exports.ReferenceReflection = ReferenceReflection;
//# sourceMappingURL=reference.js.map