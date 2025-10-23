"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtKeyword = fmtKeyword;
const _util_1 = require("../../../util/index.js");
const leaf_node_1 = require("./leaf-node");
function fmtKeyword(node, _) {
    switch (node.type) {
        // Space rules
        case _util_1.GRAMMAR.RULE.FUNCTION_KEYWORD:
        case _util_1.GRAMMAR.RULE.PROCEDURE_KEYWORD: {
            return [
                {
                    text: (0, leaf_node_1.textForLeafNode)(node),
                    spaceAfter: true,
                    range: (0, _util_1.toDocumentRange)(node),
                },
            ];
        }
        // New line rules
        case _util_1.GRAMMAR.RULE.BEGIN_KEYWORD:
        case _util_1.GRAMMAR.RULE.IS_KEYWORD:
        case _util_1.GRAMMAR.RULE.AS_KEYWORD:
        case _util_1.GRAMMAR.RULE.DECLARE_KEYWORD: {
            return [
                {
                    text: (0, leaf_node_1.textForLeafNode)(node),
                    newLine: true,
                    range: (0, _util_1.toDocumentRange)(node),
                },
            ];
        }
        default: {
            return [
                {
                    text: (0, leaf_node_1.textForLeafNode)(node),
                    spaceAfter: true,
                    range: (0, _util_1.toDocumentRange)(node),
                },
            ];
        }
    }
}
//# sourceMappingURL=keyword.js.map