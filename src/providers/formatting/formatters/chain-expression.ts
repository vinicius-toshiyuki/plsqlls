import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "@util";
import { textForLeafNode } from "./leaf-node";
import { assertAtLeastOnePart } from "./util/asserts";

export function fmtChainExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.EXPRESSION: {
          const parts = fmtNode(child, options);

          assertAtLeastOnePart(parts);
          parts[parts.length - 1].spaceAfter = false;

          return parts;
      }
      case GRAMMAR.RULE.IDENTIFIER: {
        return [{ ...fmtNode1(child, options), spaceAfter: false }];
      }
      case GRAMMAR.RULE.PERIOD_PUNCTUATION: {
        return [{ text: textForLeafNode(child) }];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
