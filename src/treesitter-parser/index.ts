import Parser from "tree-sitter";
import PlSql from "@treesitter-parser/binding";

export function createParser() {
  const parser = new Parser();
  parser.setLanguage(PlSql);
  return parser;
}
