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
let ConditionalTypeSerializer = class ConditionalTypeSerializer extends components_1.TypeSerializerComponent {
    supports(item) {
        return item instanceof models_1.ConditionalType;
    }
    toObject(conditional, obj) {
        obj = obj || {};
        obj.checkType = this.owner.toObject(conditional.checkType);
        obj.extendsType = this.owner.toObject(conditional.extendsType);
        obj.trueType = this.owner.toObject(conditional.trueType);
        obj.falseType = this.owner.toObject(conditional.falseType);
        return obj;
    }
};
ConditionalTypeSerializer = __decorate([
    component_1.Component({ name: 'serializer:conditional-type' })
], ConditionalTypeSerializer);
exports.ConditionalTypeSerializer = ConditionalTypeSerializer;
//# sourceMappingURL=conditional.js.map