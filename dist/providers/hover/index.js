"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnHoverHandler = getOnHoverHandler;
const _util_1 = require("../../util/index.js");
function getOnHoverHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return null;
        }
        const node = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        if (!node) {
            return null;
        }
        const symbol = (0, _util_1.getSymbol)(node, context.symbols);
        const declarationScope = symbol?.declaration
            ? (0, _util_1.getContainingScope)(symbol.declaration.node)
            : null;
        const nodeScope = (0, _util_1.getContainingScope)(node);
        if (!nodeScope) {
            return null;
        }
        const nodeScopeId = (0, _util_1.getScopeId)(nodeScope);
        const symbolScope = nodeScopeId === "global"
            ? context.symbols.global
            : context.symbols.scopes[nodeScopeId];
        let declarationSymbolScope;
        if (declarationScope && symbol?.declaration) {
            const declarationScopeId = (0, _util_1.getScopeId)(declarationScope);
            declarationSymbolScope =
                declarationScopeId === "global"
                    ? context.symbols.global
                    : context.symbols.scopes[declarationScopeId];
        }
        const hover = {
            range: (0, _util_1.toDocumentRange)(node),
            contents: `Declaration scope: ${declarationScope?.type ?? "not found"} (${declarationSymbolScope ? Object.keys(declarationSymbolScope).join(", ") : "not found"})
      Containing scope: ${nodeScope?.type ?? "not found"} (${nodeScope ? Object.keys(symbolScope).join(", ") : "not found"})`,
        };
        return hover;
    };
}
//# sourceMappingURL=index.js.map