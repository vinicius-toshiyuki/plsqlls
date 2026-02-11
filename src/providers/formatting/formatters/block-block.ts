import { FormatOptions, FormatPart } from "@types";
import { GRAMMAR, toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { textForLeafNode } from "./leaf-node";

export function fmtBlockBody(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.BEGIN_KEYWORD:
        return [
          {
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
            range: toDocumentRange(child),
          },
        ];
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
