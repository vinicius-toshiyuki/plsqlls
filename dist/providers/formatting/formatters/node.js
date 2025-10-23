"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtNode = fmtNode;
exports.fmtNode1 = fmtNode1;
const _util_1 = require("../../../util/index.js");
const leaf_node_1 = require("./leaf-node");
const keyword_1 = require("./keyword");
const function_definition_1 = require("./function-definition");
const param_declaration_list_1 = require("./param-declaration-list");
const block_declaration_list_1 = require("./block-declaration-list");
const if_statement_1 = require("./if-statement");
const select_1 = require("./select");
const chain_accessor_1 = require("./chain-accessor");
const chain_expression_1 = require("./chain-expression");
const statement_1 = require("./statement");
const call_expression_1 = require("./call-expression");
function fmtNode(node, options) {
    switch (node.type) {
        case _util_1.GRAMMAR.RULE.SEMICOLON_PUNCTUATION: {
            return [
                {
                    text: (0, leaf_node_1.textForLeafNode)(node),
                    newLine: true,
                    range: (0, _util_1.toDocumentRange)(node),
                },
            ];
        }
        case _util_1.GRAMMAR.RULE.FUNCTION_DEFINITION: {
            return (0, function_definition_1.fmtFunctionDefinition)(node, options);
        }
        case _util_1.GRAMMAR.RULE.PARAM_DECLARATION_LIST: {
            return (0, param_declaration_list_1.fmtParamDeclarationList)(node, options);
        }
        case _util_1.GRAMMAR.RULE.BLOCK_DECLARATION_LIST: {
            return (0, block_declaration_list_1.fmtBlockDeclarationList)(node, options);
        }
        case _util_1.GRAMMAR.RULE.STATEMENT: {
            return (0, statement_1.fmtStatement)(node, options);
        }
        case _util_1.GRAMMAR.RULE.IF_STATEMENT: {
            return (0, if_statement_1.fmtIfStatement)(node, options);
        }
        case _util_1.GRAMMAR.RULE.SELECT: {
            return (0, select_1.fmtSelect)(node, options);
        }
        case _util_1.GRAMMAR.RULE.CHAIN_ACCESSOR: {
            return (0, chain_accessor_1.fmtChainAccessor)(node, options);
        }
        case _util_1.GRAMMAR.RULE.CHAIN_EXPRESSION: {
            return (0, chain_expression_1.fmtChainExpression)(node, options);
        }
        case _util_1.GRAMMAR.RULE.CALL_EXPRESSION: {
            return (0, call_expression_1.fmtCallExpression)(node, options);
        }
        default: {
            if (_util_1.KEYWORD_NODE_TYPES.includes(node.type)) {
                return (0, keyword_1.fmtKeyword)(node, options);
            }
            if (node.children.length > 0) {
                return node.children.flatMap((child) => fmtNode(child, options));
            }
            else {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(node),
                        spaceAfter: true,
                        range: (0, _util_1.toDocumentRange)(node),
                    },
                ];
            }
        }
    }
}
function fmtNode1(node, options) {
    const parts = fmtNode(node, options);
    if (parts.length !== 1) {
        throw new Error("Expected a single part");
    }
    return parts[0];
}
//# sourceMappingURL=node.js.map