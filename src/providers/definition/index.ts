import {
  Declaration,
  DeclarationLink,
  DeclarationParams,
} from "vscode-languageserver";
import { ServerContext } from "@types";
import { toDocumentRange, toTreeSitterPosition } from "@util";
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

    const declarationNode = getDeclaration(node, context);

    if (!declarationNode) {
      return null;
    }

    const declaration: Declaration = {
      uri: params.textDocument.uri,
      range: toDocumentRange(declarationNode),
    };
    return declaration;
  };
}
