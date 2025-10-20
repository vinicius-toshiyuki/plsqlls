import { Hover, HoverParams } from "vscode-languageserver";
import { Scope, ServerContext } from "@types";
import {
  getContainingScope,
  getScopeId,
  getSymbol,
  toDocumentRange,
  toTreeSitterPosition,
} from "@util";

export function getOnHoverHandler(
  context: ServerContext,
): (params: HoverParams) => Hover | null | undefined {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return null;
    }

    const node = tree.rootNode.descendantForPosition(
      toTreeSitterPosition(params.position),
    );

    if (!node) {
      return null;
    }

    const symbol = getSymbol(node, context.symbols);

    const declarationScope = symbol?.declaration
      ? getContainingScope(symbol.declaration.node)
      : null;

    const nodeScope = getContainingScope(node);

    if (!nodeScope) {
      return null;
    }

    const nodeScopeId = getScopeId(nodeScope);
    const symbolScope =
      nodeScopeId === "global"
        ? context.symbols.global
        : context.symbols.scopes[nodeScopeId];

    let declarationSymbolScope: Scope | undefined;

    if (declarationScope && symbol?.declaration) {
      const declarationScopeId = getScopeId(declarationScope);
      declarationSymbolScope =
        declarationScopeId === "global"
          ? context.symbols.global
          : context.symbols.scopes[declarationScopeId];
    }

    const hover: Hover = {
      range: toDocumentRange(node),
      contents: `Declaration scope: ${declarationScope?.type ?? "not found"} (${declarationSymbolScope ? Object.keys(declarationSymbolScope).join(", ") : "not found"})
      Containing scope: ${nodeScope?.type ?? "not found"} (${nodeScope ? Object.keys(symbolScope).join(", ") : "not found"})`,
    };

    return hover;
  };
}
