"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnFoldingRangesHandler = getOnFoldingRangesHandler;
const _util_1 = require("../../util/index.js");
function getFoldingRanges(tree) {
    const ranges = [];
    (0, _util_1.walkBreadth)(tree.rootNode, (node) => {
        if ([
            _util_1.GRAMMAR.RULE.FOR_STATEMENT,
            _util_1.GRAMMAR.RULE.CASE_STATEMENT,
            _util_1.GRAMMAR.RULE.IF_STATEMENT,
        ].includes(node.type)) {
            ranges.push({
                startLine: node.startPosition.row,
                endLine: node.endPosition.row,
                // collapsedText
            });
        }
        return false;
    });
    return ranges;
}
function getOnFoldingRangesHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return [];
        }
        const ranges = getFoldingRanges(tree);
        return ranges;
    };
}
//# sourceMappingURL=index.js.map