
const Parser = require("tree-sitter");
const PlSql = require("./tree_sitter_plsqloracle_binding.node");

module.exports = {
    createParser() {
        const parser = new Parser();
        parser.setLanguage(PlSql);
        return parser;
    }
}
