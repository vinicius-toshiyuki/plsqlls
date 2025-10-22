import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { assertAtLeastOnePart } from "./util/asserts";

export function fmtBinaryExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    const parts = fmtNode(child, options);
    assertAtLeastOnePart(parts);
    parts[parts.length - 1].spaceAfter = !!child.nextSibling;
    return parts;
  });
}
