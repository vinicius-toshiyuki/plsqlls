"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnReferencesHandler = getOnReferencesHandler;
const _util_1 = require("../../util/index.js");
function getOnReferencesHandler(context) {
    return (params) => {
        const uri = params.textDocument.uri;
        const tree = context.trees[uri];
        if (!tree) {
            return null;
        }
        const node = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        const symbol = (0, _util_1.getSymbol)(node, context.symbols);
        if (symbol) {
            return symbol.references
                .filter((ref) => params.context.includeDeclaration ||
                symbol.declaration === null ||
                ref.node.id !== symbol.declaration.node.id)
                .map((ref) => ({
                uri: symbol.uri,
                range: (0, _util_1.toDocumentRange)(ref.node),
            }));
        }
        return null;
    };
}
//# sourceMappingURL=index.js.map