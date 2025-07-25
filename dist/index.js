"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const formatting_1 = require("./providers/formatting/index.js");
const completion_1 = require("./providers/completion/index.js");
const diagnostics_1 = require("./providers/diagnostics/index.js");
const folding_1 = require("./providers/folding/index.js");
const rename_1 = require("./providers/rename/index.js");
const declaration_1 = require("./providers/declaration/index.js");
const treesitter_parser_1 = require("./treesitter-parser");
const code_actions_1 = require("./providers/code-actions/index.js");
const _util_1 = require("./util/index.js");
const definition_1 = require("./providers/definition/index.js");
const fs_1 = __importDefault(require("fs"));
const vscode_uri_1 = require("vscode-uri");
const path_1 = __importDefault(require("path"));
const references_1 = require("./providers/references");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const parser = (0, treesitter_parser_1.createParser)();
const context = {
    documents: new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument),
    trees: {},
    configs: {},
    symbols: {
        global: {},
        scopes: {},
    },
    sendMessage: (type, message) => {
        connection.sendNotification("window/showMessage", {
            type,
            message,
        });
    },
};
connection.onInitialize(() => {
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            documentFormattingProvider: true,
            documentRangeFormattingProvider: true,
            completionProvider: {},
            diagnosticProvider: {
                interFileDependencies: false,
                documentSelector: null,
                workspaceDiagnostics: false,
            },
            foldingRangeProvider: true,
            renameProvider: { prepareProvider: true },
            declarationProvider: true,
            definitionProvider: true,
            codeActionProvider: {
                codeActionKinds: [node_1.CodeActionKind.QuickFix],
            },
            referencesProvider: true,
            // TODO
            // semanticTokensProvider: {
            //   legend: {
            //     tokenTypes: [],
            //     tokenModifiers: [],
            //   },
            //   full: true,
            // },
        },
    };
    return result;
});
context.documents.onDidChangeContent((change) => {
    const uri = change.document.uri;
    context.trees[uri] = parser.parse(change.document.getText());
    if (!context.configs[uri]) {
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
                context.configs[uri] = JSON.parse(fs_1.default.readFileSync(configPath, { encoding: "utf8" }));
            }
            catch (e) {
                context.sendMessage(node_1.MessageType.Error, "Failed to read config file: " + configPath + " " + e);
            }
        }
    }
    Object.entries(context.symbols.scopes)
        .filter(([_, scope]) => Object.values(scope).some((ref) => ref.uri === uri))
        .forEach(([scopeId]) => {
        delete context.symbols.scopes[Number(scopeId)];
    });
    (0, _util_1.walkDepthFirst)(context.trees[uri].rootNode, (node) => {
        var _a;
        if (!(0, _util_1.isReference)(node)) {
            return false;
        }
        // TODO: Should look in all documents
        const declarationNode = (0, declaration_1.getDeclaration)(node);
        const scopeNode = (0, _util_1.getContainingScope)(declarationNode ?? node);
        if (!scopeNode) {
            return false;
        }
        const scopeId = (0, _util_1.getScopeId)(scopeNode);
        if (scopeId !== "global" && !context.symbols.scopes[scopeId]) {
            context.symbols.scopes[scopeId] = {};
        }
        const scope = scopeId === "global"
            ? context.symbols.global
            : context.symbols.scopes[scopeId];
        const symbol = (scope[_a = (0, _util_1.getIdentifierKey)(node)] ?? (scope[_a] = {
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
        }));
        if (symbol.definition?.node.id !== declarationNode?.id ||
            symbol.declaration?.node.id !== declarationNode?.id) {
            connection.console.warn(`Different declaration/definition for symbol "${(0, _util_1.getIdentifierKey)(node)}" in scope starting at L:${scopeNode.startPosition.row},C:${scopeNode.startPosition.column}`);
        }
        symbol.references.push({ uri, node });
        return false;
    });
});
connection.onDeclaration((0, declaration_1.getOnDeclarationHandler)(context));
connection.onDefinition((0, definition_1.getOnDefinitionHandler)(context));
connection.onPrepareRename((0, rename_1.getOnPrepareRenameHandler)(context));
connection.onRenameRequest((0, rename_1.getOnRenameRequestHandler)(context));
connection.languages.diagnostics.on((0, diagnostics_1.getOnDiagnosticsHandler)(context));
connection.onCodeAction((0, code_actions_1.getOnCodeActionHandler)(context));
connection.onCompletion((0, completion_1.getOnCompletionHandler)(context));
connection.onFoldingRanges((0, folding_1.getOnFoldingRangesHandler)(context));
connection.onDocumentRangeFormatting((0, formatting_1.getOnDocumentRangeFormattingHandler)(context));
connection.onDocumentFormatting((0, formatting_1.getOnDocumentFormattingHandler)(context));
connection.onReferences((0, references_1.getOnReferencesHandler)(context));
context.documents.listen(connection);
connection.listen();
//# sourceMappingURL=index.js.map