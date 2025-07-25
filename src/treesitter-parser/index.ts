import Parser from "tree-sitter";
import PlSql from "./tree_sitter_plsqloracle_binding.node";

export function createParser() {
  const parser = new Parser();
  parser.setLanguage(PlSql);
  return parser;
}
