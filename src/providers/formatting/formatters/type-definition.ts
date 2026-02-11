import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { GRAMMAR } from "tree-sitter-plsqloracle/grammar-constants";

function fmtRecordMemberDeclaration(
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
            widthMatching: { namespace, group: "identifier" },
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}

function fmtRecordDefinition(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const namespace = node.id.toFixed(0);
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.IS_KEYWORD: {
        return [
          {
            ...fmtNode1(child, options),
            newLine: false,
            spaceAfter: true,
          },
        ];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__OPEN: {
        return [
          {
            ...fmtNode1(child, options),
            newLine: true,
            indentAfter: options.indentAmount,
          },
        ];
      }
      case GRAMMAR.RULE.RECORD_MEMBER_DECLARATION: {
        return fmtRecordMemberDeclaration(child, options, namespace);
      }
      case GRAMMAR.RULE.COMMA_PUNCTUATION: {
        return [
          {
            ...fmtNode1(child, options),
            newLine: true,
            spaceBeforeCollapse: true,
          },
        ];
      }
      case GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE: {
        return [
          {
            ...fmtNode1(child, options),
            newLineBefore: true,
            indent: -options.indentAmount,
            spaceBeforeCollapse: true,
            spaceAfter: false,
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}

export function fmtTypeDefinition(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.RECORD_DEFINITION: {
        return fmtRecordDefinition(child, options);
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
