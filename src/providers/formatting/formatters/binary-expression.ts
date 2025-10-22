import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";

export function fmtBinaryExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const [exp1, op, exp2] = node.children;

  return fmtNode(exp1, options)
    .concat(fmtNode(op, options))
    .concat(fmtNode(exp2, options));
}
