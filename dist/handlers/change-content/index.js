"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnDidChangeContentHandler = getOnDidChangeContentHandler;
const plsql_1 = require("../../treesitter-parser/index.js");
const _util_1 = require("../../util/index.js");
const path_1 = __importDefault(require("path"));
const vscode_languageserver_1 = require("vscode-languageserver");
const fs_1 = __importDefault(require("fs"));
const vscode_uri_1 = require("vscode-uri");
const declaration_1 = require("../../providers/declaration/index.js");
function getOnDidChangeContentHandler(context) {
    return (change) => {
        const uri = change.document.uri;
        const parser = (0, plsql_1.createParser)();
        if (uri in context.trees) {
            delete context.trees[uri];
            // const tree = context.trees[uri];
            // let newIndex = 0,
            //   oldIndex = 0,
            //   changeStart: SyntaxNode | null = null;
            // for (const [diffStatus] of diff(
            //   change.document.getText(),
            //   tree.rootNode.text,
            // )) {
            //   if (diffStatus === 0) {
            //     newIndex++;
            //     oldIndex++;
            //     if (changeStart !== null) {
            //       const oldChangeEnd = tree.rootNode.descendantForIndex(oldIndex);
            //       const newChangeEnd = tree.rootNode.descendantForIndex(newIndex);
            //       tree.edit({
            //         startIndex: changeStart.startIndex,
            //         startPosition: changeStart.startPosition,
            //         oldEndIndex: oldChangeEnd.endIndex,
            //         oldEndPosition: oldChangeEnd.endPosition,
            //         newEndIndex: newChangeEnd.endIndex,
            //         newEndPosition: newChangeEnd.endPosition,
            //       });
            //       changeStart = null;
            //     }
            //   } else if (changeStart === null) {
            //     changeStart = tree.rootNode.descendantForIndex(newIndex);
            //   } else if (diffStatus === -1) {
            //     oldIndex++;
            //   } else {
            //     newIndex++;
            //   }
            // }
        }
        context.trees[uri] = parser.parse(change.document.getText(), context.trees[uri]);
        let dirname = path_1.default.dirname(vscode_uri_1.URI.parse(uri).fsPath);
        let configPath;
        while (true) {
            for (const file of fs_1.default.readdirSync(dirname)) {
                if (path_1.default.parse(file).base === "plsqllsrc.json") {
                    configPath = path_1.default.resolve(path_1.default.join(dirname, file));
                    break;
                }
            }
            if (configPath || dirname === path_1.default.parse(dirname).root) {
                break;
            }
            dirname = path_1.default.join(dirname, "..");
        }
        if (configPath) {
            try {
                const configVersion = fs_1.default.statSync(configPath).ctime.toISOString();
                const configText = fs_1.default.readFileSync(configPath, { encoding: "utf8" });
                if (!context.configs[uri] ||
                    context.configs[uri].version !== configVersion) {
                    context.configs[uri] = {
                        version: configVersion,
                        options: JSON.parse(configText),
                    };
                }
            }
            catch (e) {
                context.sendMessage(vscode_languageserver_1.MessageType.Error, "Failed to read config file: " + configPath + " " + e);
            }
        }
        Object.entries(context.symbols.scopes)
            .filter(([_, scope]) => Object.values(scope).some((ref) => ref.uri === uri))
            .forEach(([scopeId]) => {
            delete context.symbols.scopes[Number(scopeId)];
        });
        Object.entries(context.symbols.global).forEach(([identifier, symbol]) => {
            if (symbol.uri !== uri) {
                return;
            }
            delete context.symbols.global[identifier];
        });
        for (const node of (0, _util_1.traverse)(context.trees[uri].rootNode)) {
            if (!(0, _util_1.isReference)(node)) {
                continue;
            }
            // TODO: Should look in all documents
            const declarationNode = (0, declaration_1.getDeclaration)(node, context);
            const scopeNode = (0, _util_1.getContainingScope)(declarationNode ?? node);
            if (!scopeNode) {
                continue;
            }
            const scopeId = (0, _util_1.getScopeId)(scopeNode);
            const scopeNodeId = (0, _util_1.getGlobalScopeId)(scopeNode);
            if (scopeId !== "global" && !context.symbols.scopes[scopeId]) {
                delete context.symbols.scopes[scopeId];
                context.symbols.scopes[scopeId] = {};
            }
            else {
                for (const identifier of Object.keys(context.symbols.global)) {
                    if (context.symbols.global[identifier].scopeNodeId !== scopeNodeId) {
                        continue;
                    }
                    delete context.symbols.global[identifier];
                }
            }
            const scope = scopeId === "global"
                ? context.symbols.global
                : context.symbols.scopes[scopeId];
            // TODO: deal with duplicate definitions in global scope
            const symbol = (scope[(0, _util_1.getIdentifierKey)(node)] ??= {
                uri,
                references: [],
                declaration: declarationNode && {
                    uri,
                    node: declarationNode,
                },
                definition: declarationNode && {
                    uri,
                    node: declarationNode, // TODO: Should look for the definition
                },
                scopeNodeId,
            });
            if (scopeId !== "global" &&
                // symbol.definition?.node.id !== declarationNode?.id ||
                symbol.declaration?.node.id !== declarationNode?.id) {
                context.console.warn(`Different declaration/definition for symbol "${(0, _util_1.getIdentifierKey)(node)}" in scope starting at L:${scopeNode.startPosition.row},C:${scopeNode.startPosition.column}`);
            }
            symbol.references.push({ uri, node });
        }
    };
}
//# sourceMappingURL=index.js.map