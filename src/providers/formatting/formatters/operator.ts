import { SyntaxNode } from "tree-sitter";
import { FormatOptions, FormatPart } from "@types";

export function fmtOperator(
  node: SyntaxNode,
  _: FormatOptions,
): FormatPart[] {
  return [
    {
      text: " " + node.text.toUpperCase() + " ",
    },
  ];
}
