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
  isField,
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
        let candidate: SyntaxNode | undefined;
        if (isField(currentNode, GRAMMAR.FIELD.DECLARATION_IDENTIFIER)) {
          candidate = currentNode;
        } else if (programNameNode) {
          candidate = programNameNode;
        } else if (isField(currentNode, GRAMMAR.FIELD.TABLE_ALIAS)) {
          candidate = currentNode;
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
