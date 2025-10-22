import { FormatOptions, FormatPart, FormatPartWidthMatching } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "@util";
import { textForLeafNode } from "./leaf-node";
import { assertAtLeastOnePart } from "./util/asserts";

function fmtSelectColumn(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.AS_KEYWORD: {
        return [{ text: textForLeafNode(child), spaceAfter: true }];
      }
      case GRAMMAR.RULE.IDENTIFIER: {
        return [{ ...fmtNode1(child, options), spaceAfter: false }];
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
        };
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}

function alignWithSelect(
  node: SyntaxNode,
  parts: FormatPart[],
  _: FormatOptions,
  beforeFirstNodeType: string,
  widthMatching: FormatPartWidthMatching,
): void {
  assertAtLeastOnePart(parts);

  const firstPart = parts[0];
  const isFirstColumn = node.previousSibling?.type === beforeFirstNodeType;
  if (isFirstColumn) {
    firstPart.break = { indentAfter: widthMatching };
  }
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
        const parts = fmtSelectColumn(child, options);

        assertAtLeastOnePart(parts);
        alignWithSelect(child, parts, options, GRAMMAR.RULE.SELECT_KEYWORD, {
          namespace,
          group,
        });

        return parts;
      }
      case GRAMMAR.RULE.SELECT_KEYWORD:
      case GRAMMAR.RULE.INTO_KEYWORD:
      case GRAMMAR.RULE.WHERE_KEYWORD: {
        return [
          {
            text: textForLeafNode(child),
            spaceAfter: true,
            widthMatching: { namespace, group },
            newLineBefore: true,
          },
        ];
      }
      case GRAMMAR.RULE.CHAIN_ACCESSOR: {
        const parts = fmtNode(child, options);

        assertAtLeastOnePart(parts);
        alignWithSelect(child, parts, options, GRAMMAR.RULE.INTO_KEYWORD, {
          namespace,
          group,
        });

        parts[parts.length - 1].spaceAfter = false;

        return parts;
      }
      case GRAMMAR.RULE.COMMA_PUNCTUATION: {
        return [
          {
            text: textForLeafNode(child),
            spaceAfter: true,
            break: { indentAfter: { namespace, group } },
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
