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
let IndexedAccessTypeSerializer = class IndexedAccessTypeSerializer extends components_1.TypeSerializerComponent {
    supports(item) {
        return item instanceof models_1.IndexedAccessType;
    }
    toObject(type, obj) {
        return Object.assign(Object.assign({}, obj), { indexType: this.owner.toObject(type.indexType), objectType: this.owner.toObject(type.objectType) });
    }
};
IndexedAccessTypeSerializer = __decorate([
    component_1.Component({ name: 'serializer:indexed-access-type' })
], IndexedAccessTypeSerializer);
exports.IndexedAccessTypeSerializer = IndexedAccessTypeSerializer;
//# sourceMappingURL=indexed-access.js.map