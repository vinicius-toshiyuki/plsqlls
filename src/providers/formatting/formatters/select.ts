import { FormatOptions, FormatPart } from "@types";
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
): FormatPart[] {
  const indentAmount = getIndentAmount(options);

  const insertNewLine = (node: SyntaxNode, parts: FormatPart[]) => {
    assertAtLeastOnePart(parts);

    const lastPart = parts[parts.length - 1];
    const isTableLastNode =
      node.nextSibling?.type === GRAMMAR.RULE.JOIN_KEYWORD;
    if (isTableLastNode) {
      lastPart.newLine = true;
    }
  };

  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.FROM_KEYWORD:
      case GRAMMAR.RULE.JOIN_KEYWORD: {
        return {
          text: textForLeafNode(child).padEnd(indentAmount - 1),
          spaceAfter: true,
        };
      }
      default: {
        const parts = fmtNode(child, options);
        insertNewLine(child, parts);
        return parts;
      }
    }
  });
}

function getIndentAmount(options: FormatOptions): number {
  return options.indentText === " "
    ? "SELECT".length + 1
    : options.indentAmount;
}

function alignWithSelect(
  node: SyntaxNode,
  parts: FormatPart[],
  options: FormatOptions,
  beforeFirstNodeType: string,
): void {
  const indentAmount = getIndentAmount(options);

  assertAtLeastOnePart(parts);

  const firstPart = parts[0];
  const isFirstColumn = node.previousSibling?.type === beforeFirstNodeType;
  if (isFirstColumn) {
    firstPart.indentAfter = indentAmount;
  }

  const lastPart = parts[parts.length - 1];
  const isLastColumn =
    node.nextSibling?.type !== GRAMMAR.RULE.COMMA_PUNCTUATION;
  if (isLastColumn) {
    lastPart.newLine = true;
    lastPart.indentAfter = -indentAmount;
  }
}

export function fmtSelect(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const indentAmount = getIndentAmount(options);

  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.SELECT_COLUMN: {
        const parts = fmtSelectColumn(child, options);

        assertAtLeastOnePart(parts);
        alignWithSelect(child, parts, options, GRAMMAR.RULE.SELECT_KEYWORD);

        return parts;
      }
      case GRAMMAR.RULE.INTO_KEYWORD:
      case GRAMMAR.RULE.WHERE_KEYWORD: {
        return {
          text: textForLeafNode(child).padEnd(indentAmount - 1),
          spaceAfter: true,
        };
      }
      case GRAMMAR.RULE.CHAIN_ACCESSOR: {
        const parts = fmtNode(child, options);

        assertAtLeastOnePart(parts);
        alignWithSelect(child, parts, options, GRAMMAR.RULE.INTO_KEYWORD);

        parts[parts.length - 1].spaceAfter = false;

        return parts;
      }
      case GRAMMAR.RULE.COMMA_PUNCTUATION: {
        return [
          {
            text: textForLeafNode(child),
            spaceAfter: true,
            break: { indentAfter: indentAmount },
          },
        ];
      }
      case GRAMMAR.RULE.SELECT_TABLES: {
        return fmtSelectTables(child, options);
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
