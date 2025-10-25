import { FormatOptions, FormatPart } from "@types";
import { GRAMMAR, toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { textForLeafNode } from "./leaf-node";
import { assertAtLeastOnePart } from "./util/asserts";

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
    const rowDiff =
      child.startPosition.row -
      (child.previousSibling?.endPosition ?? child.startPosition).row;

    switch (child.type) {
      case GRAMMAR.RULE.BLOCK_DECLARATION: {
        const parts = fmtBlockDeclaration(child, options, namespace);

        assertAtLeastOnePart(parts);

        if (rowDiff > 1) {
          parts[0].skipLines = 1;
        }

        return parts;
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });

  return parts;
}
