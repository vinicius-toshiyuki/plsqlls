import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { assertAtLeastOnePart } from "./util/asserts";

export function fmtStatement(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const rowDiff =
    node.startPosition.row -
    (node.previousSibling?.endPosition ?? node.startPosition).row;

  const parts = node.children.flatMap((child) => fmtNode(child, options));

  assertAtLeastOnePart(parts);

  if (rowDiff > 1) {
    parts[0].skipLines = 1;
  }

  return parts;
}
