import { FormatOptions, FormatPart } from "@types";
import { GRAMMAR, toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { textForLeafNode } from "./leaf-node";

export function fmtProcedureDefinition(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.PROCEDURE_KEYWORD:
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE:
      case GRAMMAR.RULE.RETURN_KEYWORD: {
        return [fmtNode1(child, options)];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN:
        return [
          {
            text: textForLeafNode(child),
            break: true,
            range: toDocumentRange(child),
          },
        ];
      case GRAMMAR.RULE.IS_KEYWORD:
        return [
          {
            text: textForLeafNode(child),
            indentAfter: options.indentAmount,
            newLine: true,
            newLineBefore: true,
            spaceBeforeCollapse: true,
            range: toDocumentRange(child),
          },
        ];
      case GRAMMAR.RULE.BEGIN_KEYWORD:
        return [
          {
            indent: -options.indentAmount,
            indentAfter: options.indentAmount,
            text: textForLeafNode(child),
            newLine: true,
            range: toDocumentRange(child),
          },
        ];
      case GRAMMAR.RULE.END_KEYWORD:
        return [
          {
            indent: -options.indentAmount,
            text: textForLeafNode(child),
            spaceAfter: true,
            range: toDocumentRange(child),
          },
        ];
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
