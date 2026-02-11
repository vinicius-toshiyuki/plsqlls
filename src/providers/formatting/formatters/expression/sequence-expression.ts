import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "../node";
import { GRAMMAR } from "@util";
import { fmtNode1 } from "../node";

export function fmtSequenceExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN: {
        return [
          {
            ...fmtNode1(child, options),
            spaceAfter: false,
          },
        ];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE: {
        return [
          {
            ...fmtNode1(child, options),
            spaceBeforeCollapse: true,
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
