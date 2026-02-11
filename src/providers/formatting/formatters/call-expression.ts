import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "@util";
import { assertAtLeastOnePart } from "./util/asserts";

function fmtArguments(node: SyntaxNode, options: FormatOptions): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.COMMA_PUNCTUATION: {
        return [
          {
            ...fmtNode1(child, options),
            break: true,
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

export function fmtCallExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.ARGUMENTS: {
        const parts = fmtArguments(child, options);

        assertAtLeastOnePart(parts);
        parts[parts.length - 1].break = { indentAfter: -options.indentAmount };

        return parts;
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN: {
        return [
          {
            ...fmtNode1(child, options),
            break: {
              indentAfter: options.indentAmount,
            },
            spaceAfter: false,
            spaceBeforeCollapse: true,
          },
        ];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE: {
        return [
          {
            ...fmtNode1(child, options),
            indent: -options.indentAmount,
            spaceAfter: true,
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
