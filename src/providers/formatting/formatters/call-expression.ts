import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { GRAMMAR } from "@util";
import { assertAtLeastOnePart } from "./util/asserts";

export function fmtCallExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.EXPRESSION:
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN:
      case GRAMMAR.RULE.ARGUMENTS: {
        const parts = fmtNode(child, options);
        assertAtLeastOnePart(parts);

        parts[parts.length - 1].spaceAfter = false;

        return parts;
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
