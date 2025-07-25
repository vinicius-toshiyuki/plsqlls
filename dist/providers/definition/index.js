"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnDefinitionHandler = getOnDefinitionHandler;
const _util_1 = require("../../util/index.js");
const declaration_1 = require("../declaration/index.js");
function getOnDefinitionHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return null;
        }
        const node = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        if (node && !(0, _util_1.isReference)(node)) {
            return null;
        }
        const declarationNode = (0, declaration_1.getDeclaration)(node);
        if (!declarationNode) {
            return null;
        }
        const declaration = {
            uri: params.textDocument.uri,
            range: {
                start: (0, _util_1.toDocumentPosition)(declarationNode.startPosition),
                end: (0, _util_1.toDocumentPosition)(declarationNode.endPosition),
            },
        };
        return declaration;
    };
}
//# sourceMappingURL=index.js.map