"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtCallExpression = fmtCallExpression;
const node_1 = require("./node");
const _util_1 = require("../../../util/index.js");
const asserts_1 = require("./util/asserts");
function fmtCallExpression(node, options) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.EXPRESSION:
            case _util_1.GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN:
            case _util_1.GRAMMAR.RULE.ARGUMENTS: {
                const parts = (0, node_1.fmtNode)(child, options);
                (0, asserts_1.assertAtLeastOnePart)(parts);
                parts[parts.length - 1].spaceAfter = false;
                return parts;
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
//# sourceMappingURL=call-expression.js.map