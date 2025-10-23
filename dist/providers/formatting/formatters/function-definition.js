"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtFunctionDefinition = fmtFunctionDefinition;
const _util_1 = require("../../../util/index.js");
const util_1 = require("./util");
const node_1 = require("./node");
const leaf_node_1 = require("./leaf-node");
function fmtFunctionDefinition(node, options) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.FUNCTION_KEYWORD:
            case _util_1.GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE:
            case _util_1.GRAMMAR.RULE.RETURN_KEYWORD: {
                return [(0, util_1.spaceAfterPart)(child, options)];
            }
            case _util_1.GRAMMAR.RULE.TYPE: {
                return [
                    {
                        ...(0, node_1.fmtNode1)(child, options),
                        newLine: true,
                    },
                ];
            }
            case _util_1.GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN:
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        break: true,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            case _util_1.GRAMMAR.RULE.IS_KEYWORD:
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        indentAfter: options.indentAmount,
                        newLine: true,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            case _util_1.GRAMMAR.RULE.BEGIN_KEYWORD:
                return [
                    {
                        indent: -options.indentAmount,
                        indentAfter: options.indentAmount,
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        newLine: true,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            case _util_1.GRAMMAR.RULE.END_KEYWORD:
                return [
                    {
                        indent: -options.indentAmount,
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
//# sourceMappingURL=function-definition.js.map