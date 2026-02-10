import { GRAMMAR, KEYWORD_NODE_TYPES, toDocumentRange } from "@util";
import { SyntaxNode } from "tree-sitter";
import { FormatOptions, FormatPart } from "@types";
import { textForLeafNode } from "./leaf-node";
import { fmtKeyword } from "./keyword";
import { fmtFunctionDefinition } from "./function-definition";
import { fmtParamDeclarationList } from "./param-declaration-list";
import { fmtBlockDeclarationList } from "./block-declaration-list";
import { fmtIfStatement } from "./if-statement";
import { fmtSelect } from "./select";
import { fmtChainAccessor } from "./chain-accessor";
import { fmtChainExpression } from "./chain-expression";
import { fmtStatement } from "./statement";
import { fmtCallExpression } from "./call-expression";
import { assertOnePart } from "./util/asserts";
import { fmtProcedureDefinition } from "./procedure-definition";
import { fmtType } from "./type";
import { fmtString } from "./string";
import { fmtTypeDefinition } from "./type-definition";
import { fmtLoopStatement } from "./loop-statement";
import { fmtForStatement } from "./for-statement";

export function fmtNode(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  switch (node.type) {
    case GRAMMAR.RULE.SEMICOLON_PUNCTUATION: {
      return [
        {
          text: textForLeafNode(node),
          newLine: true,
          spaceBeforeCollapse: true,
          range: toDocumentRange(node),
        },
      ];
    }
    case GRAMMAR.RULE.FUNCTION_DEFINITION: {
      return fmtFunctionDefinition(node, options);
    }
    case GRAMMAR.RULE.PROCEDURE_DEFINITION: {
      return fmtProcedureDefinition(node, options);
    }
    case GRAMMAR.RULE.PARAM_DECLARATION_LIST: {
      return fmtParamDeclarationList(node, options);
    }
    case GRAMMAR.RULE.BLOCK_DECLARATION_LIST: {
      return fmtBlockDeclarationList(node, options);
    }
    case GRAMMAR.RULE.UDT_DEFINITION: {
      return fmtTypeDefinition(node, options);
    }
    case GRAMMAR.RULE.STATEMENT: {
      return fmtStatement(node, options);
    }
    case GRAMMAR.RULE.IF_STATEMENT: {
      return fmtIfStatement(node, options);
    }
    case GRAMMAR.RULE.FOR_STATEMENT: {
      return fmtForStatement(node, options);
    }
    case GRAMMAR.RULE.LOOP_STATEMENT: {
      return fmtLoopStatement(node, options);
    }
    case GRAMMAR.RULE.SELECT: {
      return fmtSelect(node, options);
    }
    case GRAMMAR.RULE.CHAIN_ACCESSOR: {
      return fmtChainAccessor(node, options);
    }
    case GRAMMAR.RULE.CHAIN_EXPRESSION: {
      return fmtChainExpression(node, options);
    }
    case GRAMMAR.RULE.CALL_EXPRESSION: {
      return fmtCallExpression(node, options);
    }
    case GRAMMAR.RULE.TYPE: {
      return fmtType(node, options);
    }
    case GRAMMAR.RULE.STRING: {
      return fmtString(node, options);
    }
    default: {
      if (KEYWORD_NODE_TYPES.includes(node.type)) {
        return fmtKeyword(node, options);
      }

      if (node.children.length > 0) {
        return node.children.flatMap((child) => fmtNode(child, options));
      } else {
        return [
          {
            text: textForLeafNode(node),
            spaceAfter: true,
            range: toDocumentRange(node),
          },
        ];
      }
    }
  }
}

export function fmtNode1(node: SyntaxNode, options: FormatOptions): FormatPart {
  const parts = fmtNode(node, options);
  assertOnePart(parts);

  return parts[0];
}
