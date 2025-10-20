import {
  TextDocumentSyncKind,
  TextDocuments,
  createConnection,
  InitializeResult,
  ProposedFeatures,
  CodeActionKind,
  MessageType,
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
import {
  getDeclaration,
  getOnDeclarationHandler,
} from "@providers/declaration";
import { ServerContext } from "./types";
import { createParser } from "./treesitter-parser";
import { getOnCodeActionHandler } from "@providers/code-actions";
import {
  getContainingScope,
  getIdentifierKey,
  getScopeId,
  isReference,
  walkDepthFirst,
} from "@util";
import { getOnDefinitionHandler } from "@providers/definition";
import fs from "fs";
import { URI } from "vscode-uri";
import path from "path";
import { getOnReferencesHandler } from "./providers/references";
import { getOnHoverHandler } from "./providers/hover";

const connection = createConnection(ProposedFeatures.all);

const parser = createParser();
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

context.documents.onDidChangeContent((change) => {
  const uri = change.document.uri;
  context.trees[uri] = parser.parse(change.document.getText());

  if (!context.configs[uri]) {
    let dirname = path.dirname(URI.parse(uri).fsPath);
    let configPath: string | undefined;
    while (true) {
      for (const file of fs.readdirSync(dirname)) {
        if (path.parse(file).base === "plsqllsrc.json") {
          configPath = path.resolve(path.join(dirname, file));
          break;
        }
      }
      if (configPath || dirname === path.parse(dirname).root) {
        break;
      }
      dirname = path.join(dirname, "..");
    }

    if (configPath) {
      try {
        context.configs[uri] = JSON.parse(
          fs.readFileSync(configPath, { encoding: "utf8" }),
        );
      } catch (e) {
        context.sendMessage(
          MessageType.Error,
          "Failed to read config file: " + configPath + " " + e,
        );
      }
    }
  }

  Object.entries(context.symbols.scopes)
    .filter(([_, scope]) => Object.values(scope).some((ref) => ref.uri === uri))
    .forEach(([scopeId]) => {
      delete context.symbols.scopes[Number(scopeId)];
    });
  walkDepthFirst(context.trees[uri].rootNode, (node) => {
    if (!isReference(node)) {
      return false;
    }

    // TODO: Should look in all documents
    const declarationNode = getDeclaration(node);
    const scopeNode = getContainingScope(declarationNode ?? node);

    if (!scopeNode) {
      return false;
    }

    const scopeId = getScopeId(scopeNode);

    if (scopeId !== "global" && !context.symbols.scopes[scopeId]) {
      context.symbols.scopes[scopeId] = {};
    }

    const scope =
      scopeId === "global"
        ? context.symbols.global
        : context.symbols.scopes[scopeId];

    const symbol = (scope[getIdentifierKey(node)] ??= {
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
    });

    if (
      symbol.definition?.node.id !== declarationNode?.id ||
      symbol.declaration?.node.id !== declarationNode?.id
    ) {
      connection.console.warn(
        `Different declaration/definition for symbol "${getIdentifierKey(node)}" in scope starting at L:${scopeNode.startPosition.row},C:${scopeNode.startPosition.column}`,
      );
    }
    symbol.references.push({ uri, node });
    return false;
  });
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
