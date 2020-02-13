"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../sources/index");
const abstract_1 = require("./abstract");
const container_1 = require("./container");
const utils_1 = require("./utils");
class ProjectReflection extends container_1.ContainerReflection {
    constructor(name) {
        super(name, abstract_1.ReflectionKind.Global);
        this.reflections = {};
        this.symbolMapping = {};
        this.directory = new index_1.SourceDirectory();
        this.files = [];
    }
    isProject() {
        return true;
    }
    getReflectionsByKind(kind) {
        const values = [];
        for (const id in this.reflections) {
            const reflection = this.reflections[id];
            if (reflection.kindOf(kind)) {
                values.push(reflection);
            }
        }
        return values;
    }
    findReflectionByName(arg) {
        const names = Array.isArray(arg) ? arg : utils_1.splitUnquotedString(arg, '.');
        const name = names.pop();
        search: for (const key in this.reflections) {
            const reflection = this.reflections[key];
            if (reflection.name !== name) {
                continue;
            }
            let depth = names.length - 1;
            let target = reflection;
            while ((target = target.parent) && depth >= 0) {
                if (target.name !== names[depth]) {
                    continue search;
                }
                depth -= 1;
            }
            return reflection;
        }
        return undefined;
    }
}
exports.ProjectReflection = ProjectReflection;
//# sourceMappingURL=project.js.map