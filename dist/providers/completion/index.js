"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnCompletionHandler = getOnCompletionHandler;
const binding_1 = __importDefault(require("../../treesitter-parser/binding.js"));
const _util_1 = require("../../util/index.js");
const tree_sitter_1 = require("tree-sitter");
const vscode_languageserver_1 = require("vscode-languageserver");
function getIndetifierCompletions(node) {
    const items = {};
    (0, _util_1.walkBreadth)(node, (currentNode) => {
        if (currentNode.type === "identifier") {
            let kind = vscode_languageserver_1.CompletionItemKind.Property;
            // TODO: item kind should be decidable using only the current node info
            if (currentNode.closest(_util_1.GRAMMAR.RULE.PARAM_DECLARATION)) {
                kind = vscode_languageserver_1.CompletionItemKind.Variable;
            }
            else if (currentNode.closest("block_declaration")) {
                if (currentNode.nextSibling?.type === "constant_keyword") {
                    kind = vscode_languageserver_1.CompletionItemKind.Constant;
                }
                else {
                    kind = vscode_languageserver_1.CompletionItemKind.Variable;
                }
            }
            else if (currentNode.closest(_util_1.GRAMMAR.RULE.FUNCTION_DEFINITION)) {
                kind = vscode_languageserver_1.CompletionItemKind.Function;
            }
            items[currentNode.text] = {
                label: currentNode.text,
                kind: items[currentNode.text]?.kind ?? kind,
            };
        }
        return false;
    });
    return Object.values(items);
}
function getKeywordCompletions(node) {
    const it = new tree_sitter_1.LookaheadIterator(binding_1.default, node.parseState);
    return [...it]
        .filter((type) => type.match(/_keyword$/))
        .map((type) => ({
        label: type.replace(/_keyword/, "").toUpperCase(),
        kind: vscode_languageserver_1.CompletionItemKind.Keyword,
    }));
}
function getOnCompletionHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return [];
        }
        const identifierItems = getIndetifierCompletions(tree.rootNode);
        const currentNode = tree.rootNode.descendantForPosition((0, _util_1.toTreeSitterPosition)(params.position));
        const keywordItems = getKeywordCompletions(currentNode);
        return {
            isIncomplete: true,
            items: [...identifierItems, ...keywordItems],
        };
    };
}
//# sourceMappingURL=index.js.map