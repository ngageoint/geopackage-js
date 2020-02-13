"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../../../utils/component");
const models_1 = require("../../../models");
const components_1 = require("../../components");
let ReferenceReflectionSerializer = class ReferenceReflectionSerializer extends components_1.ReflectionSerializerComponent {
    supports(t) {
        return t instanceof models_1.ReferenceReflection;
    }
    toObject(ref, obj) {
        var _a, _b;
        return Object.assign(Object.assign({}, obj), { target: (_b = (_a = ref.tryGetTargetReflection()) === null || _a === void 0 ? void 0 : _a.id, (_b !== null && _b !== void 0 ? _b : -1)) });
    }
};
ReferenceReflectionSerializer = __decorate([
    component_1.Component({ name: 'serializer:reference-reflection' })
], ReferenceReflectionSerializer);
exports.ReferenceReflectionSerializer = ReferenceReflectionSerializer;
//# sourceMappingURL=reference.js.map