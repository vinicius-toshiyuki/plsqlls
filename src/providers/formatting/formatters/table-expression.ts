import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "@util";

export function fmtTableExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.TABLE_KEYWORD: {
        return [
          {
            ...fmtNode1(child, options),
            spaceAfter: false,
          },
        ];
      }
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
