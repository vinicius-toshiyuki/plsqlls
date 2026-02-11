import { KEYWORD_NODE_TYPES, toDocumentRange } from "@util";
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
import { fmtStatement } from "./statement";
import { assertOnePart } from "./util/asserts";
import { fmtProcedureDefinition } from "./procedure-definition";
import { fmtType } from "./type";
import { fmtString } from "./string";
import { fmtTypeDefinition } from "./type-definition";
import { fmtLoopStatement } from "./loop-statement";
import { fmtForStatement } from "./for-statement";
import { fmtBlockBody } from "./block-block";
import { fmtExpression } from "./expression/index";
import { fmtAccessor } from "./accessor";
import { fmtTableExpression } from "./table-expression";
import { GRAMMAR } from "tree-sitter-plsqloracle/grammar-constants";

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
    case GRAMMAR.RULE.BLOCK_BODY: {
      return fmtBlockBody(node, options);
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
    case GRAMMAR.RULE.TABLE_EXPRESSION: {
      return fmtTableExpression(node, options);
    }
    case GRAMMAR.RULE.SELECT: {
      return fmtSelect(node, options);
    }
    case GRAMMAR.RULE.ACCESSOR: {
        return fmtAccessor(node, options);
    }
    case GRAMMAR.RULE.CHAIN_ACCESSOR: {
      return fmtChainAccessor(node, options);
    }
    case GRAMMAR.RULE.EXPRESSION: {
      return fmtExpression(node, options);
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
