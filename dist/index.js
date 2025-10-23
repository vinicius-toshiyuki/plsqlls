"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const formatting_1 = require("./providers/formatting/index.js");
const completion_1 = require("./providers/completion/index.js");
const folding_1 = require("./providers/folding/index.js");
const rename_1 = require("./providers/rename/index.js");
const declaration_1 = require("./providers/declaration/index.js");
const code_actions_1 = require("./providers/code-actions/index.js");
const definition_1 = require("./providers/definition/index.js");
const references_1 = require("./providers/references");
const hover_1 = require("./providers/hover");
const change_content_1 = require("./handlers/change-content");
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
const context = {
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
    console: connection.console,
};
const changeTimeouts = {};
connection.onInitialize(() => {
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            documentFormattingProvider: true,
            documentRangeFormattingProvider: true,
            completionProvider: {},
            // diagnosticProvider: {
            //   interFileDependencies: false,
            //   documentSelector: null,
            //   workspaceDiagnostics: false,
            // },
            foldingRangeProvider: true,
            renameProvider: { prepareProvider: true },
            declarationProvider: true,
            definitionProvider: true,
            codeActionProvider: {
                codeActionKinds: [node_1.CodeActionKind.QuickFix],
            },
            referencesProvider: true,
            hoverProvider: true,
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
const debounceHandler = (uri, change) => () => {
    delete changeTimeouts[uri];
    (0, change_content_1.getOnDidChangeContentHandler)(context)(change);
};
const CONTENT_CHANGE_DEBOUNCE = 100;
documents.onDidChangeContent((change) => {
    const uri = change.document.uri;
    const timeout = changeTimeouts[uri];
    if (timeout) {
        clearTimeout(timeout);
    }
    changeTimeouts[uri] = setTimeout(debounceHandler(uri, change), CONTENT_CHANGE_DEBOUNCE);
    return {
        dispose: () => {
            if (changeTimeouts[uri]) {
                clearTimeout(changeTimeouts[uri]);
                delete changeTimeouts[uri];
            }
        },
    };
});
connection.onDeclaration((0, declaration_1.getOnDeclarationHandler)(context));
connection.onDefinition((0, definition_1.getOnDefinitionHandler)(context));
connection.onPrepareRename((0, rename_1.getOnPrepareRenameHandler)(context));
connection.onRenameRequest((0, rename_1.getOnRenameRequestHandler)(context));
// connection.languages.diagnostics.on(getOnDiagnosticsHandler(context));
connection.onCodeAction((0, code_actions_1.getOnCodeActionHandler)(context));
connection.onCompletion((0, completion_1.getOnCompletionHandler)(context));
connection.onFoldingRanges((0, folding_1.getOnFoldingRangesHandler)(context));
connection.onDocumentRangeFormatting((0, formatting_1.getOnDocumentRangeFormattingHandler)(context));
connection.onDocumentFormatting((0, formatting_1.getOnDocumentFormattingHandler)(context));
connection.onReferences((0, references_1.getOnReferencesHandler)(context));
connection.onHover((0, hover_1.getOnHoverHandler)(context));
documents.listen(connection);
connection.listen();
//# sourceMappingURL=index.js.map