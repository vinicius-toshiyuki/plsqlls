import Parser from "tree-sitter";
import PlSql from "tree-sitter-plsqloracle";

export function createParser() {
  const parser = new Parser();
  parser.setLanguage(PlSql);
  return parser;
}
