import { ServerContext } from "@types";
import { walkBreadth } from "@util";
import { Tree } from "tree-sitter";
import { GRAMMAR } from "tree-sitter-plsqloracle/grammar-constants";
import { FoldingRange, FoldingRangeParams } from "vscode-languageserver";

function getFoldingRanges(tree: Tree): FoldingRange[] {
  const ranges: FoldingRange[] = [];

  walkBreadth(tree.rootNode, (node) => {
    if (
      [
        GRAMMAR.RULE.FOR_STATEMENT,
        GRAMMAR.RULE.CASE_STATEMENT,
        GRAMMAR.RULE.IF_STATEMENT,
      ].includes(node.type)
    ) {
      ranges.push({
        startLine: node.startPosition.row,
        endLine: node.endPosition.row,
        // collapsedText
      });
    }
    return false;
  });

  return ranges;
}

export function getOnFoldingRangesHandler(
  context: ServerContext,
): (params: FoldingRangeParams) => FoldingRange[] | null | undefined {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return [];
    }

    const ranges = getFoldingRanges(tree);

    return ranges;
  };
}
