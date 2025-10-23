import {
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
  InitializeResult,
  ProposedFeatures,
  CodeActionKind,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  getOnDocumentFormattingHandler,
  getOnDocumentRangeFormattingHandler,
} from "@providers/formatting";
import { getOnCompletionHandler } from "@providers/completion";
import { getOnDiagnosticsHandler } from "@providers/diagnostics";
import { getOnFoldingRangesHandler } from "@providers/folding";
import {
  getOnPrepareRenameHandler,
  getOnRenameRequestHandler,
} from "@providers/rename";
import { ServerContext } from "./types";
import { getOnCodeActionHandler } from "@providers/code-actions";
import { getOnDefinitionHandler } from "@providers/definition";
import { getOnReferencesHandler } from "./providers/references";
import { getOnHoverHandler } from "./providers/hover";

const connection = createConnection(ProposedFeatures.all);

const context: ServerContext = {
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

connection.onInitialize(() => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
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
        codeActionKinds: [CodeActionKind.QuickFix],
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


connection.onDeclaration(getOnDeclarationHandler(context));
connection.onDefinition(getOnDefinitionHandler(context));
connection.onPrepareRename(getOnPrepareRenameHandler(context));
connection.onRenameRequest(getOnRenameRequestHandler(context));
connection.languages.diagnostics.on(getOnDiagnosticsHandler(context));
connection.onCodeAction(getOnCodeActionHandler(context));
connection.onCompletion(getOnCompletionHandler(context));
connection.onFoldingRanges(getOnFoldingRangesHandler(context));
connection.onDocumentRangeFormatting(
  getOnDocumentRangeFormattingHandler(context),
);
connection.onDocumentFormatting(getOnDocumentFormattingHandler(context));
connection.onReferences(getOnReferencesHandler(context));
connection.onHover(getOnHoverHandler(context));

context.documents.listen(connection);
connection.listen();
