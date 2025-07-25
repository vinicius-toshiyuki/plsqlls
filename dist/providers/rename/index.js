"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnPrepareRenameHandler = getOnPrepareRenameHandler;
exports.getOnRenameRequestHandler = getOnRenameRequestHandler;
const _util_1 = require("../../util/index.js");
function getRenameEdits(symbol, newIdentifier) {
    var _a, _b, _c, _d, _e, _f;
    const edits = {
        changes: {},
    };
    const viewdRefs = [];
    if (symbol.declaration) {
        viewdRefs.push(symbol.declaration.node.id);
        (_a = edits.changes)[_b = symbol.declaration.uri] ?? (_a[_b] = []);
        edits.changes[symbol.declaration.uri].push({
            newText: newIdentifier,
            range: (0, _util_1.toDocumentRange)(symbol.declaration.node),
        });
    }
    if (symbol.definition && !viewdRefs.includes(symbol.definition.node.id)) {
        viewdRefs.push(symbol.definition.node.id);
        (_c = edits.changes)[_d = symbol.definition.uri] ?? (_c[_d] = []);
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
        (_e = edits.changes)[_f = ref.uri] ?? (_e[_f] = []);
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