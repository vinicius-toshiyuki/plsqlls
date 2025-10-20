import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { GRAMMAR } from "@util";
import { spaceAfterPart } from "./util";
import { textForLeafNode } from "./leaf-node";

export function fmtIfStatement(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.IF_KEYWORD: {
        return [spaceAfterPart(child, options)];
      }
      case GRAMMAR.RULE.EXPRESSION: {
        const parts = fmtNode(child, options);
        parts.at(-1)!.spaceAfter = true;
        parts.at(-1)!.break = { indentAfter: 0 };
        return parts;
      }
      case GRAMMAR.RULE.THEN_KEYWORD: {
        return [
          {
            text: textForLeafNode(child),
            newLine: true,
            indentAfter: options.indentAmount,
          },
        ];
      }
      case GRAMMAR.RULE.END_IF_KEYWORD: {
        return [
          {
            text: textForLeafNode(child),
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
