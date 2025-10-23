"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtChainExpression = fmtChainExpression;
const node_1 = require("./node");
const _util_1 = require("../../../util/index.js");
const leaf_node_1 = require("./leaf-node");
const asserts_1 = require("./util/asserts");
function fmtChainExpression(node, options) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.EXPRESSION: {
                const parts = (0, node_1.fmtNode)(child, options);
                (0, asserts_1.assertAtLeastOnePart)(parts);
                parts[parts.length - 1].spaceAfter = false;
                return parts;
            }
            case _util_1.GRAMMAR.RULE.IDENTIFIER: {
                return [
                    { ...(0, node_1.fmtNode1)(child, options), spaceAfter: !child.nextSibling },
                ];
            }
            case _util_1.GRAMMAR.RULE.PERIOD_PUNCTUATION: {
                return [
                    { text: (0, leaf_node_1.textForLeafNode)(child), range: (0, _util_1.toDocumentRange)(child) },
                ];
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
//# sourceMappingURL=chain-expression.js.map