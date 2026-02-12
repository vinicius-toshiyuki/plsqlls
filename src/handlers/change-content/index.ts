import { createParser } from "@treesitter-parser/plsql";
import {
  getContainingScope,
  getGlobalScopeId,
  getIdentifierKey,
  getScopeId,
  isReference,
  traverse,
} from "@util";
import { ServerContext } from "@types";
import path from "path";
import { MessageType, TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import fs from "fs";
import { URI } from "vscode-uri";
import { getDeclaration } from "@providers/declaration";

export function getOnDidChangeContentHandler(
  context: ServerContext,
): (change: TextDocumentChangeEvent<TextDocument>) => any {
  return (change) => {
    const uri = change.document.uri;
    const parser = createParser();

    context.trees[uri] = parser.parse(
      change.document.getText(),
      context.trees[uri],
    );
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
        const configVersion = fs.statSync(configPath).ctime.toISOString();
        const configText = fs.readFileSync(configPath, { encoding: "utf8" });
        if (
          !context.configs[uri] ||
          context.configs[uri].version !== configVersion
        ) {
          context.configs[uri] = {
            version: configVersion,
            options: JSON.parse(configText),
          };
        }
      } catch (e) {
        context.sendMessage(
          MessageType.Error,
          "Failed to read config file: " + configPath + " " + e,
        );
      }
    }

    Object.entries(context.symbols.scopes)
      .filter(([_, scope]) =>
        Object.values(scope).some((ref) => ref.uri === uri),
      )
      .forEach(([scopeId]) => {
        delete context.symbols.scopes[Number(scopeId)];
      });

    Object.entries(context.symbols.global).forEach(([identifier, symbol]) => {
      if (symbol.uri !== uri) {
        return;
      }
      delete context.symbols.global[identifier];
    });

    for (const node of traverse(context.trees[uri].rootNode)) {
      if (!isReference(node)) {
        continue;
      }

      // TODO: Should look in all documents
      const declarationNode = getDeclaration(node, context);
      const scopeNode = getContainingScope(declarationNode ?? node);

      if (!scopeNode) {
        continue;
      }

      const scopeId = getScopeId(scopeNode);
      const scopeNodeId = getGlobalScopeId(scopeNode);

      if (scopeId !== "global" && !context.symbols.scopes[scopeId]) {
        delete context.symbols.scopes[scopeId];
        context.symbols.scopes[scopeId] = {};
      } else {
        for (const identifier of Object.keys(context.symbols.global)) {
          if (context.symbols.global[identifier].scopeNodeId !== scopeNodeId) {
            continue;
          }

          delete context.symbols.global[identifier];
        }
      }

      const scope =
        scopeId === "global"
          ? context.symbols.global
          : context.symbols.scopes[scopeId];

      // TODO: deal with duplicate definitions in global scope
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
        scopeNodeId,
      });

      if (
        scopeId !== "global" &&
        // symbol.definition?.node.id !== declarationNode?.id ||
        symbol.declaration?.node.id !== declarationNode?.id
      ) {
        context.console.warn(
          `Different declaration/definition for symbol "${getIdentifierKey(node)}" in scope starting at L:${scopeNode.startPosition.row},C:${scopeNode.startPosition.column}`,
        );
      }

      symbol.references.push({ uri, node });
    }
  };
}
