"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtIfStatement = fmtIfStatement;
const node_1 = require("./node");
const _util_1 = require("../../../util/index.js");
const util_1 = require("./util");
const leaf_node_1 = require("./leaf-node");
function fmtIfStatement(node, options) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.IF_KEYWORD: {
                return [(0, util_1.spaceAfterPart)(child, options)];
            }
            case _util_1.GRAMMAR.RULE.EXPRESSION: {
                const parts = (0, node_1.fmtNode)(child, options);
                parts.at(-1).spaceAfter = true;
                parts.at(-1).break = { indentAfter: 0 };
                return parts;
            }
            case _util_1.GRAMMAR.RULE.THEN_KEYWORD: {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        newLine: true,
                        indentAfter: options.indentAmount,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            }
            case _util_1.GRAMMAR.RULE.END_IF_KEYWORD: {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        indent: -options.indentAmount,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
//# sourceMappingURL=if-statement.js.map