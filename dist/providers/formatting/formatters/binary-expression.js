"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtBinaryExpression = fmtBinaryExpression;
const node_1 = require("./node");
const asserts_1 = require("./util/asserts");
function fmtBinaryExpression(node, options) {
    return node.children.flatMap((child) => {
        const parts = (0, node_1.fmtNode)(child, options);
        (0, asserts_1.assertAtLeastOnePart)(parts);
        parts[parts.length - 1].spaceAfter = !!child.nextSibling;
        return parts;
    });
}
//# sourceMappingURL=binary-expression.js.map