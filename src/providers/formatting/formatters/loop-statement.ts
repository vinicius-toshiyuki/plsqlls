import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "@util";

export function fmtLoopStatement(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.LOOP_KEYWORD: {
        return [
          {
            ...fmtNode1(child, options),
            newLine: true,
            indentAfter: options.indentAmount,
          },
        ];
      }
      case GRAMMAR.RULE.END_LOOP_KEYWORD: {
        return [
          {
            ...fmtNode1(child, options),
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
