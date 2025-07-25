import { ServerContext } from "@types";
import { getSymbol, toDocumentRange, toTreeSitterPosition } from "@util";
import { Location, ReferenceParams } from "vscode-languageserver";

export function getOnReferencesHandler(
  context: ServerContext,
): (params: ReferenceParams) => Location[] | undefined | null {
  return (params) => {
    const uri = params.textDocument.uri;
    const tree = context.trees[uri];
    if (!tree) {
      return null;
    }

    const node = tree.rootNode.descendantForPosition(
      toTreeSitterPosition(params.position),
    );

    const symbol = getSymbol(node, context.symbols);

    if (symbol) {
      return symbol.references
        .filter(
          (ref) =>
            params.context.includeDeclaration ||
            symbol.declaration === null ||
            ref.node.id !== symbol.declaration.node.id,
        )
        .map(
          (ref): Location => ({
            uri: symbol.uri,
            range: toDocumentRange(ref.node),
          }),
        );
    }

    return null;
  };
}
