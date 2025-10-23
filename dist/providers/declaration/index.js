"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeclaration = getDeclaration;
exports.getOnDeclarationHandler = getOnDeclarationHandler;
const _util_1 = require("../../util/index.js");
function getDeclaration(identifierNode, context) {
    if (context) {
        const symbol = (0, _util_1.getSymbol)(identifierNode, context.symbols);
        if (symbol) {
            return symbol.declaration?.node ?? null;
        }
    }
    let scope = (0, _util_1.getContainingScope)(identifierNode);
    const identifierKey = (0, _util_1.getIdentifierKey)(identifierNode);
    while (scope) {
        let declarationNode = null;
        for (const currentNode of (0, _util_1.traverse)(scope)) {
            if (!(0, _util_1.isBuiltinNode)(currentNode)) {
                const programNameNode = currentNode.childForFieldName(_util_1.GRAMMAR.FIELD.PROGRAM_NAME);
                let candidate;
                if ((0, _util_1.isField)(currentNode, _util_1.GRAMMAR.FIELD.DECLARATION_IDENTIFIER)) {
                    candidate = currentNode;
                }
                else if (programNameNode) {
                    candidate = programNameNode;
                }
                else if ((0, _util_1.isField)(currentNode, _util_1.GRAMMAR.FIELD.TABLE_ALIAS)) {
                    candidate = currentNode;
                }
                if (candidate && (0, _util_1.getIdentifierKey)(candidate) === identifierKey) {
                    declarationNode = candidate;
                    break;
                }
            }
            if (scope !== currentNode && (0, _util_1.isScopeNode)(currentNode)) {
                break;
            }
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
        const node = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        const declarationNode = getDeclaration(node, context);
        if (!declarationNode) {
            return null;
        }
        const declaration = {
            uri: params.textDocument.uri,
            range: (0, _util_1.toDocumentRange)(declarationNode),
        };
        return declaration;
    };
}
//# sourceMappingURL=index.js.map