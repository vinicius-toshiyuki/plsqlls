import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "../node";
import { GRAMMAR } from "@util";
import { fmtSequenceExpression } from "./sequence-expression";
import { fmtChainExpression } from "./chain-expression";
import { fmtCallExpression } from "./call-expression";

export function fmtExpression(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.SEQUENCE_EXPRESSION: {
        return fmtSequenceExpression(child, options);
      }
      case GRAMMAR.RULE.CHAIN_EXPRESSION: {
        return fmtChainExpression(child, options);
      }
      case GRAMMAR.RULE.CALL_EXPRESSION: {
        return fmtCallExpression(child, options);
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
