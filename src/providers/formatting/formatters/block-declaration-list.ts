import { FormatOptions, FormatPart } from "@types";
import { GRAMMAR, toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { textForLeafNode } from "./leaf-node";

function fmtBlockDeclaration(
  node: SyntaxNode,
  options: FormatOptions,
  namespace: string,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.IDENTIFIER: {
        return [
          {
            ...fmtNode1(child, options),
            widthMatching: {
              namespace,
              group: "identifier",
            },
          },
          { text: " ", range: toDocumentRange(child) },
        ];
      }
      case GRAMMAR.RULE.SEMICOLON_PUNCTUATION: {
        return [
          {
            text: textForLeafNode(child),
            newLine: true,
            spaceBeforeCollapse: true,
            range: toDocumentRange(child),
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}

export function fmtBlockDeclarationList(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const namespace = node.id.toFixed(0);
  const parts = node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.BLOCK_DECLARATION: {
        return fmtBlockDeclaration(child, options, namespace);
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });

  return parts;
}
