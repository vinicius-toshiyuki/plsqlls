import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "@util";

export function fmtAccessor(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.COLON_PUNCTUATION: {
        return [
          {
            ...fmtNode1(child, options),
            spaceAfter: false,
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
