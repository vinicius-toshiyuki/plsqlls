import { GRAMMAR, KEYWORD_NODE_TYPES, OPERATOR_NODE_TYPES } from "@util";
import PlSql from "@treesitter-parser/binding";
import { Query, SyntaxNode } from "tree-sitter";

const UPPER_CASE_TYPES = [
  GRAMMAR.RULE.BUILTIN_PROGRAM,
  GRAMMAR.RULE.BUILTIN_TYPE_NAME,
  GRAMMAR.RULE.CONSTANT,
  GRAMMAR.RULE.BOOLEAN,
  GRAMMAR.RULE.DUAL_BUILTIN,
  ...OPERATOR_NODE_TYPES,
  ...KEYWORD_NODE_TYPES,
];

export function textForLeafNode(node: SyntaxNode): string {
  if (node.children.length > 0) {
    throw new Error("Only leaf nodes allowed");
  }

  let newText: string;
  if (UPPER_CASE_TYPES.includes(node.type)) {
    newText = node.text.toUpperCase();
  } else if (node.type === GRAMMAR.RULE.UDT) {
    newText = node.text.toLowerCase();
  } else if (node.type === GRAMMAR.RULE.TYPE) {
    const typeQuery = new Query(PlSql, `[(builtin_type) (udt)] @type`);
    const [capture] = typeQuery.captures(node);
    if (capture.node.type === GRAMMAR.RULE.BUILTIN_TYPE) {
      newText = capture.node.text.toUpperCase();
    } else {
      newText = capture.node.text.toLowerCase();
    }
  } else if (node.type === GRAMMAR.RULE.IDENTIFIER) {
    if (node.previousSibling?.type === GRAMMAR.RULE.COLON_PUNCTUATION) {
      newText = node.text.toUpperCase();
    } else if (node.text.startsWith('"') && node.text.endsWith('"')) {
      newText = node.text;
    } else {
      newText = node.text.toLowerCase();
    }
    // } else if (node.children.length > 0) {
    //   node.children.forEach((child) => fmtNode(child));
    //   newText = node.text + "<" + node.type + ">";
  } else {
    newText = node.text;
  }

  return newText;
}
