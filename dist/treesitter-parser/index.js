"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParser = createParser;
const tree_sitter_1 = __importDefault(require("tree-sitter"));
const binding_1 = __importDefault(require("./binding.js"));
function createParser() {
    const parser = new tree_sitter_1.default();
    parser.setLanguage(binding_1.default);
    return parser;
}
//# sourceMappingURL=index.js.map