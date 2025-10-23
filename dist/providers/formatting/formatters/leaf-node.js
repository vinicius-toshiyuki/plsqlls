"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.textForLeafNode = textForLeafNode;
const _util_1 = require("../../../util/index.js");
const binding_1 = __importDefault(require("../../../treesitter-parser/binding.js"));
const tree_sitter_1 = require("tree-sitter");
const UPPER_CASE_TYPES = [
    _util_1.GRAMMAR.RULE.BUILTIN_PROGRAM,
    _util_1.GRAMMAR.RULE.BUILTIN_TYPE,
    _util_1.GRAMMAR.RULE.CONSTANT,
    _util_1.GRAMMAR.RULE.BOOLEAN,
    _util_1.GRAMMAR.RULE.DUAL_BUILTIN,
    ..._util_1.OPERATOR_NODE_TYPES,
    ..._util_1.KEYWORD_NODE_TYPES,
];
function textForLeafNode(node) {
    if (node.children.length > 0) {
        throw new Error("Only leaf nodes allowed");
    }
    let newText;
    if (UPPER_CASE_TYPES.includes(node.type)) {
        newText = node.text.toUpperCase();
    }
    else if (node.type === _util_1.GRAMMAR.RULE.UDT) {
        newText = node.text.toLowerCase();
    }
    else if (node.type === _util_1.GRAMMAR.RULE.TYPE) {
        const typeQuery = new tree_sitter_1.Query(binding_1.default, `[(builtin_type) (udt)] @type`);
        const [capture] = typeQuery.captures(node);
        if (capture.node.type === _util_1.GRAMMAR.RULE.BUILTIN_TYPE) {
            newText = capture.node.text.toUpperCase();
        }
        else {
            newText = capture.node.text.toLowerCase();
        }
    }
    else if (node.type === _util_1.GRAMMAR.RULE.IDENTIFIER) {
        if (node.previousSibling?.type === _util_1.GRAMMAR.RULE.COLON_PUNCTUATION) {
            newText = node.text.toUpperCase();
        }
        else if (node.text.startsWith('"') && node.text.endsWith('"')) {
            newText = node.text;
        }
        else {
            newText = node.text.toLowerCase();
        }
        // } else if (node.children.length > 0) {
        //   node.children.forEach((child) => fmtNode(child));
        //   newText = node.text + "<" + node.type + ">";
    }
    else {
        newText = node.text;
    }
    return newText;
}
//# sourceMappingURL=leaf-node.js.map