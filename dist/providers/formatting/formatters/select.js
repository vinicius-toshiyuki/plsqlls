"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtSelect = fmtSelect;
const node_1 = require("./node");
const _util_1 = require("../../../util/index.js");
const leaf_node_1 = require("./leaf-node");
const asserts_1 = require("./util/asserts");
function fmtSelectColumn(node, options) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.EXPRESSION: {
                const parts = (0, node_1.fmtNode)(child, options);
                (0, asserts_1.assertAtLeastOnePart)(parts);
                if (!child.nextSibling) {
                    parts[parts.length - 1].spaceAfter = false;
                }
                return parts;
            }
            case _util_1.GRAMMAR.RULE.AS_KEYWORD: {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        spaceAfter: true,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            }
            case _util_1.GRAMMAR.RULE.IDENTIFIER: {
                return [{ ...(0, node_1.fmtNode1)(child, options), spaceAfter: false }];
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
function fmtSelectTables(node, options, widthMatching) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.FROM_KEYWORD:
            case _util_1.GRAMMAR.RULE.JOIN_KEYWORD: {
                return {
                    text: (0, leaf_node_1.textForLeafNode)(child),
                    spaceAfter: true,
                    widthMatching,
                    newLineBefore: true,
                    range: (0, _util_1.toDocumentRange)(child),
                };
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
function alignWithSelect(node, parts, _, beforeFirstNodeType, widthMatching) {
    (0, asserts_1.assertAtLeastOnePart)(parts);
    const firstPart = parts[0];
    const isFirstColumn = node.previousSibling?.type === beforeFirstNodeType;
    if (isFirstColumn) {
        firstPart.break = { indentAfter: widthMatching };
    }
}
function fmtSelect(node, options) {
    const namespace = node.id.toFixed(0);
    const group = "select";
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.SELECT_COLUMN: {
                const parts = fmtSelectColumn(child, options);
                (0, asserts_1.assertAtLeastOnePart)(parts);
                alignWithSelect(child, parts, options, _util_1.GRAMMAR.RULE.SELECT_KEYWORD, {
                    namespace,
                    group,
                });
                return parts;
            }
            case _util_1.GRAMMAR.RULE.SELECT_KEYWORD:
            case _util_1.GRAMMAR.RULE.INTO_KEYWORD:
            case _util_1.GRAMMAR.RULE.WHERE_KEYWORD: {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        spaceAfter: true,
                        widthMatching: { namespace, group },
                        newLineBefore: child.type !== _util_1.GRAMMAR.RULE.SELECT_KEYWORD,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            }
            case _util_1.GRAMMAR.RULE.CHAIN_ACCESSOR: {
                const parts = (0, node_1.fmtNode)(child, options);
                (0, asserts_1.assertAtLeastOnePart)(parts);
                alignWithSelect(child, parts, options, _util_1.GRAMMAR.RULE.INTO_KEYWORD, {
                    namespace,
                    group,
                });
                parts[parts.length - 1].spaceAfter = false;
                return parts;
            }
            case _util_1.GRAMMAR.RULE.COMMA_PUNCTUATION: {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        spaceAfter: true,
                        break: { indentAfter: { namespace, group } },
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            }
            case _util_1.GRAMMAR.RULE.SELECT_TABLES: {
                return fmtSelectTables(child, options, { namespace, group });
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
//# sourceMappingURL=select.js.map