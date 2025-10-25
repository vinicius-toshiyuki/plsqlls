import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "./node";
import { GRAMMAR } from "@util";

function fmtBuiltinType(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  const parts = fmtNode(node, options);
  parts.forEach((part, index, parts) => {
    part.spaceAfter = index === parts.length - 1;
  });
  return parts;
}

export function fmtType(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart[] {
  return node.children.flatMap((child) => {
    switch (child.type) {
      case GRAMMAR.RULE.BUILTIN_TYPE: {
        return fmtBuiltinType(child, options);
      }
      default: {
        return fmtNode(child, options);
      }
    }
  });
}
