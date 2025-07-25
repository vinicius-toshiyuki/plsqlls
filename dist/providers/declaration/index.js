"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeclaration = getDeclaration;
exports.getOnDeclarationHandler = getOnDeclarationHandler;
const _util_1 = require("../../util/index.js");
function getDeclaration(identifierNode, context) {
    let declarationNode = null;
    let scope = (0, _util_1.getContainingScope)(identifierNode);
    const identifierKey = (0, _util_1.getIdentifierKey)(identifierNode);
    while (scope) {
        if (context) {
            const symbol = (0, _util_1.getSymbol)(identifierNode, context.symbols);
            if (symbol) {
                declarationNode = symbol.declaration?.node ?? null;
            }
        }
        else {
            (0, _util_1.walkDepthFirst)(scope, (node) => {
                const programNameNode = node.childForFieldName(_util_1.GRAMMAR.FIELD.PROGRAM_NAME);
                const isDifferentScope = node !== scope && (0, _util_1.isScopeNode)(node);
                if (isDifferentScope && !programNameNode) {
                    return true;
                }
                let candidate = node.childForFieldName(_util_1.GRAMMAR.FIELD.DECLARATION_IDENTIFIER) ??
                    programNameNode;
                const tableNameNode = node.parent
                    ?.childrenForFieldName(_util_1.GRAMMAR.FIELD.TABLE_NAME)
                    .find(({ id }) => id === node.id);
                if (tableNameNode && !candidate) {
                    candidate ?? (candidate = node.parent
                        ?.childrenForFieldName(_util_1.GRAMMAR.FIELD.TABLE_ALIAS)
                        ?.find(({ id }) => id === tableNameNode.nextSibling?.id) ?? null);
                }
                if (candidate && (0, _util_1.getIdentifierKey)(candidate) === identifierKey) {
                    declarationNode = candidate;
                    return true;
                }
                return isDifferentScope;
            });
        }
        if (declarationNode) {
            return declarationNode;
        }
        if (!scope.parent) {
            break;
        }
        scope = (0, _util_1.getContainingScope)(scope.parent);
    }
    return null;
}
function getOnDeclarationHandler(context) {
    return (params) => {
        const uri = params.textDocument.uri;
        const tree = context.trees[uri];
        if (!tree) {
            return null;
        }
        const node = (0, _util_1.getDeepestNodeAtPosition)(tree.rootNode, params.position);
        const scope = (0, _util_1.getContainingScope)(node);
        if (!scope || !(0, _util_1.isReference)(node)) {
            return null;
        }
        const symbol = (0, _util_1.getSymbol)(node, context.symbols);
        if (!symbol?.declaration) {
            return null;
        }
        const declaration = {
            uri: params.textDocument.uri,
            range: (0, _util_1.toDocumentRange)(symbol.declaration.node),
        };
        return declaration;
    };
}
//# sourceMappingURL=index.js.map