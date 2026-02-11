import { FormatOptions, FormatPart } from "@types";
import { toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { textForLeafNode } from "./leaf-node";
import { GRAMMAR } from "tree-sitter-plsqloracle/grammar-constants";

export function fmtKeyword(node: SyntaxNode, _: FormatOptions): FormatPart[] {
  switch (node.type) {
    // Space rules
    case GRAMMAR.RULE.FUNCTION_KEYWORD:
    case GRAMMAR.RULE.PROCEDURE_KEYWORD: {
      return [
        {
          text: textForLeafNode(node),
          spaceAfter: true,
          range: toDocumentRange(node),
        },
      ];
    }
    // New line rules
    case GRAMMAR.RULE.BEGIN_KEYWORD:
    case GRAMMAR.RULE.IS_KEYWORD:
    case GRAMMAR.RULE.AS_KEYWORD:
    case GRAMMAR.RULE.DECLARE_KEYWORD: {
      return [
        {
          text: textForLeafNode(node),
          newLine: true,
          range: toDocumentRange(node),
        },
      ];
    }
    default: {
      return [
        {
          text: textForLeafNode(node),
          spaceAfter: true,
          range: toDocumentRange(node),
        },
      ];
    }
  }
}
