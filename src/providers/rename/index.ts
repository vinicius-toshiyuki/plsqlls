import {
  PrepareRenameParams,
  PrepareRenameResult,
  RenameParams,
  WorkspaceEdit,
} from "vscode-languageserver";
import { getSymbol, toDocumentRange, toTreeSitterPosition } from "@util";
import { LanguageSymbol, ServerContext } from "@types";

function getRenameEdits(
  symbol: LanguageSymbol,
  newIdentifier: string,
): WorkspaceEdit {
  const edits = {
    changes: {} as WorkspaceEdit["changes"] & object,
  } satisfies WorkspaceEdit;

  const viewdRefs: number[] = [];

  if (symbol.declaration) {
    viewdRefs.push(symbol.declaration.node.id);
    edits.changes[symbol.declaration.uri] ??= [];
    edits.changes[symbol.declaration.uri].push({
      newText: newIdentifier,
      range: toDocumentRange(symbol.declaration.node),
    });
  }

  if (symbol.definition && !viewdRefs.includes(symbol.definition.node.id)) {
    viewdRefs.push(symbol.definition.node.id);
    edits.changes[symbol.definition.uri] ??= [];
    edits.changes[symbol.definition.uri].push({
      newText: newIdentifier,
      range: toDocumentRange(symbol.definition.node),
    });
  }

  for (const ref of symbol.references) {
    if (viewdRefs.includes(ref.node.id)) {
      continue;
    }
    viewdRefs.push(ref.node.id);
    edits.changes[ref.uri] ??= [];
    edits.changes[ref.uri].push({
      newText: newIdentifier,
      range: toDocumentRange(ref.node),
    });
  }

  return edits;
}

export function getOnPrepareRenameHandler(
  context: ServerContext,
): (params: PrepareRenameParams) => PrepareRenameResult | undefined | null {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return null;
    }

    const node = tree.rootNode.descendantForPosition(
      toTreeSitterPosition(params.position),
    );
    const symbol = getSymbol(node, context.symbols);

    return !symbol || !symbol.declaration ? null : { defaultBehavior: true };
  };
}

export function getOnRenameRequestHandler(
  context: ServerContext,
): (params: RenameParams) => WorkspaceEdit {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return {};
    }

    const node = tree.rootNode.descendantForPosition(
      toTreeSitterPosition(params.position),
    );
    const symbol = getSymbol(node, context.symbols);

    if (symbol === null) {
      return {};
    }

    const edits = getRenameEdits(symbol, params.newName);

    return edits;
  };
}
