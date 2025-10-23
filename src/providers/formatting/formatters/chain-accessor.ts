import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR, toDocumentRange } from "@util";
import { textForLeafNode } from "./leaf-node";

export function fmtChainAccessor(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.ACCESSOR:
      case GRAMMAR.RULE.IDENTIFIER: {
        return [{ ...fmtNode1(child, options), spaceAfter: false }];
      }
      case GRAMMAR.RULE.PERIOD_PUNCTUATION: {
        return [
          { text: textForLeafNode(child), range: toDocumentRange(child) },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
