import { FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { FormattingOptions } from "vscode-languageserver";

export function fmtBinaryExpression(
  node: SyntaxNode,
  options: FormattingOptions,
): FormatPart[] {
  const [exp1, op, exp2] = node.children;

  return fmtNode(exp1, options)
    .concat(fmtNode(op, options))
    .concat(fmtNode(exp2, options));
}
