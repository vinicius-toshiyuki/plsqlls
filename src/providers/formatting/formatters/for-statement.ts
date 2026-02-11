import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "tree-sitter-plsqloracle/grammar-constants";

export function fmtForStatement(
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
            newLine: true,
            indentAfter: options.indentAmount,
          },
        ];
      }
      case GRAMMAR.RULE.RANGE_OPERATOR: {
        return [
          {
            ...fmtNode1(child, options),
            spaceAfter: false,
            spaceBeforeCollapse: true,
          },
        ];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE: {
        return [
          {
            ...fmtNode1(child, options),
            spaceBeforeCollapse: true,
            newLineBefore: true,
            indent: -options.indentAmount,
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
