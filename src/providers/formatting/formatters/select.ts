import { FormatOptions, FormatPart, FormatPartWidthMatching } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { GRAMMAR, toDocumentRange } from "@util";
import { textForLeafNode } from "./leaf-node";

function fmtSelectColumn(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.AS_KEYWORD: {
        return [
          {
            text: textForLeafNode(child),
            spaceAfter: true,
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

function fmtSelectTables(
  node: SyntaxNode,
  options: FormatOptions,
  widthMatching: FormatPartWidthMatching,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.FROM_KEYWORD:
      case GRAMMAR.RULE.JOIN_KEYWORD: {
        return {
          text: textForLeafNode(child),
          spaceAfter: true,
          widthMatching,
          newLineBefore: true,
          range: toDocumentRange(child),
        };
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}

export function fmtSelect(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const namespace = node.id.toFixed(0);
  const group = "select";

  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.SELECT_COLUMN: {
        return fmtSelectColumn(child, options);
      }
      case GRAMMAR.RULE.SELECT_KEYWORD:
      case GRAMMAR.RULE.INTO_KEYWORD:
      case GRAMMAR.RULE.WHERE_KEYWORD: {
        return [
          {
            text: textForLeafNode(child),
            spaceAfter: true,
            widthMatching: { namespace, group },
            newLineBefore: child.type !== GRAMMAR.RULE.SELECT_KEYWORD,
            range: toDocumentRange(child),
          },
        ];
      }
      case GRAMMAR.RULE.COMMA_PUNCTUATION: {
        return [
          {
            text: textForLeafNode(child),
            spaceAfter: true,
            break: { indentAfter: { namespace, group } },
            spaceBeforeCollapse: true,
            range: toDocumentRange(child),
          },
        ];
      }
      case GRAMMAR.RULE.SELECT_TABLES: {
        return fmtSelectTables(child, options, { namespace, group });
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
