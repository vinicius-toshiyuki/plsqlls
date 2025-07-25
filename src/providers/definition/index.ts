import {
  Declaration,
  DeclarationLink,
  DeclarationParams,
} from "vscode-languageserver";
import { ServerContext } from "@types";
import { isReference, toDocumentPosition, toTreeSitterPosition } from "@util";
import { getDeclaration } from "@providers/declaration";

export function getOnDefinitionHandler(
  context: ServerContext,
): (
  params: DeclarationParams,
) => Declaration | DeclarationLink[] | undefined | null {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];
    if (!tree) {
      return null;
    }

    const node = tree.rootNode.descendantForPosition(
      toTreeSitterPosition(params.position),
    );

    if (node && !isReference(node)) {
      return null;
    }

    const declarationNode = getDeclaration(node);

    if (!declarationNode) {
      return null;
    }

    const declaration: Declaration = {
      uri: params.textDocument.uri,
      range: {
        start: toDocumentPosition(declarationNode.startPosition),
        end: toDocumentPosition(declarationNode.endPosition),
      },
    };
    return declaration;
  };
}
