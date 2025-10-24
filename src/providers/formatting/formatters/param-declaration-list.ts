import { FormatOptions, FormatPart } from "@types";
import { GRAMMAR } from "@util";
import { SyntaxNode } from "tree-sitter";
import { fmtNode, fmtNode1 } from "./node";
import { assertAtLeastOnePart } from "./util/asserts";

function fmtParamDeclaration(
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
      case GRAMMAR.RULE.TYPE: {
        return [
          {
            ...fmtNode1(child, options),
            widthMatching: {
              namespace,
              group: "type",
            },
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}

export function fmtParamDeclarationList(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const namespace = node.id.toFixed(0);

  const parts = node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.PARAM_DECLARATION: {
        const parts = fmtParamDeclaration(child, options, namespace);

        assertAtLeastOnePart(parts);
        if (child.nextSibling === null) {
          parts[parts.length - 1].break = { indentAfter: 0 };
        }

        return parts;
      }
      case GRAMMAR.RULE.COMMA_PUNCTUATION: {
        return [
          {
            ...fmtNode1(child, options),
            break: true,
            spaceBeforeCollapse: true,
          },
        ];
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });

  return parts;
}
