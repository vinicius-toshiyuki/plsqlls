import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode1 } from "./node";
import { GRAMMAR } from "@util";

export function fmtString(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.map((child) => {
    return {
      ...fmtNode1(child, options),
      spaceAfter: child.type === GRAMMAR.RULE.STRING_BRACKET__CLOSE,
    };
  });
}
