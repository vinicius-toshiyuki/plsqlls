import { FormatOptions, FormatPart } from "@types";
import { toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { textForLeafNode } from "./leaf-node";
import { GRAMMAR } from "tree-sitter-plsqloracle/grammar-constants";

export function fmtFunctionDefinition(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.FUNCTION_KEYWORD:
      case GRAMMAR.RULE.RETURN_KEYWORD: {
        return [fmtNode1(child, options)];
      }
      case GRAMMAR.RULE.TYPE: {
        return [
          {
            ...fmtNode1(child, options),
            newLine: true,
          },
        ];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN:
        return [
          {
            text: textForLeafNode(child),
            break: {
              indentAfter: options.indentAmount,
            },
            spaceBeforeCollapse: true,
            range: toDocumentRange(child),
          },
        ];
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE:
        return [
          {
            ...fmtNode1(child, options),
            break: true,
          },
        ];
      case GRAMMAR.RULE.IS_KEYWORD:
        return [
          {
            text: textForLeafNode(child),
            indentAfter: options.indentAmount,
            newLine: true,
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
