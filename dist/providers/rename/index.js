"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnPrepareRenameHandler = getOnPrepareRenameHandler;
exports.getOnRenameRequestHandler = getOnRenameRequestHandler;
const _util_1 = require("../../util/index.js");
function getRenameEdits(symbol, newIdentifier) {
    const edits = {
        changes: {},
    };
    const viewdRefs = [];
    if (symbol.declaration) {
        viewdRefs.push(symbol.declaration.node.id);
        edits.changes[symbol.declaration.uri] ??= [];
        edits.changes[symbol.declaration.uri].push({
            newText: newIdentifier,
            range: (0, _util_1.toDocumentRange)(symbol.declaration.node),
        });
    }
    if (symbol.definition && !viewdRefs.includes(symbol.definition.node.id)) {
        viewdRefs.push(symbol.definition.node.id);
        edits.changes[symbol.definition.uri] ??= [];
        edits.changes[symbol.definition.uri].push({
            newText: newIdentifier,
            range: (0, _util_1.toDocumentRange)(symbol.definition.node),
        });
    }
    for (const ref of symbol.references) {
        if (viewdRefs.includes(ref.node.id)) {
            continue;
        }
        viewdRefs.push(ref.node.id);
        edits.changes[ref.uri] ??= [];
        edits.changes[ref.uri].push({
            newText: newIdentifier,
            range: (0, _util_1.toDocumentRange)(ref.node),
        });
    }
    return edits;
}
function getOnPrepareRenameHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return null;
        }
        const node = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        const symbol = (0, _util_1.getSymbol)(node, context.symbols);
        return !symbol || !symbol.declaration ? null : { defaultBehavior: true };
    };
}
function getOnRenameRequestHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return {};
        }
        const node = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        const symbol = (0, _util_1.getSymbol)(node, context.symbols);
        if (symbol === null) {
            return {};
        }
        const edits = getRenameEdits(symbol, params.newName);
        return edits;
    };
}
//# sourceMappingURL=index.js.map