import {
  Declaration,
  DeclarationLink,
  DeclarationParams,
} from "vscode-languageserver";
import { ServerContext } from "../../types";
import {
  getContainingScope,
  getDeepestNodeAtPosition,
  getIdentifierKey,
  getSymbol,
  GRAMMAR,
  isReference,
  isScopeNode,
  toDocumentRange,
  walkDepthFirst,
} from "@util";
import { SyntaxNode } from "tree-sitter";

export function getDeclaration(
  identifierNode: SyntaxNode,
  context?: ServerContext,
): SyntaxNode | null {
  if (context) {
    const symbol = getSymbol(identifierNode, context.symbols);
    if (symbol) {
      return symbol.declaration?.node ?? null;
    }
  }

  let scope: SyntaxNode | null = getContainingScope(identifierNode);
  const identifierKey = getIdentifierKey(identifierNode);

  while (scope) {
    let declarationNode: SyntaxNode | null = null;

    for (const currentNode of traverse(scope)) {
      if (!isBuiltinNode(currentNode)) {
        const programNameNode = currentNode.childForFieldName(
          GRAMMAR.FIELD.PROGRAM_NAME,
        );
        const isDifferentScope = node !== scope && isScopeNode(node);

        if (isDifferentScope && !programNameNode) {
          return true;
        }

        let candidate =
          node.childForFieldName(GRAMMAR.FIELD.DECLARATION_IDENTIFIER) ??
          programNameNode;

        const tableNameNode = node.parent
          ?.childrenForFieldName(GRAMMAR.FIELD.TABLE_NAME)
          .find(({ id }) => id === node.id);
        if (tableNameNode && !candidate) {
          candidate ??=
            node.parent
              ?.childrenForFieldName(GRAMMAR.FIELD.TABLE_ALIAS)
              ?.find(({ id }) => id === tableNameNode.nextSibling?.id) ?? null;
        }

        if (candidate && getIdentifierKey(candidate) === identifierKey) {
          declarationNode = candidate;
          break;
        }
      }

      if (scope !== currentNode && isScopeNode(currentNode)) {
        break;
      }
    }

    if (declarationNode) {
      return declarationNode;
    }

    if (!scope.parent) {
      break;
    }
    scope = getContainingScope(scope.parent);
  }

  return null;
}

export function getOnDeclarationHandler(
  context: ServerContext,
): (
  params: DeclarationParams,
) => Declaration | DeclarationLink[] | undefined | null {
  return (params) => {
    const uri = params.textDocument.uri;
    const tree = context.trees[uri];
    if (!tree) {
      return null;
    }

    const node = getDeepestNodeAtPosition(tree.rootNode, params.position);
    const scope = getContainingScope(node);

    if (!scope || !isReference(node)) {
      return null;
    }

    const symbol = getSymbol(node, context.symbols);

    if (!symbol?.declaration) {
      return null;
    }

    const declaration: Declaration = {
      uri: params.textDocument.uri,
      range: toDocumentRange(symbol.declaration.node),
    };
    return declaration;
  };
}
