"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtStatement = fmtStatement;
const node_1 = require("./node");
const asserts_1 = require("./util/asserts");
function fmtStatement(node, options) {
    const rowDiff = node.startPosition.row -
        (node.previousSibling?.endPosition ?? node.startPosition).row;
    const parts = node.children.flatMap((child) => (0, node_1.fmtNode)(child, options));
    (0, asserts_1.assertAtLeastOnePart)(parts);
    if (rowDiff > 1) {
        parts[0].skipLines = 1;
    }
    return parts;
}
//# sourceMappingURL=statement.js.map