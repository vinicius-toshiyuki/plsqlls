"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtBlockDeclarationList = fmtBlockDeclarationList;
const _util_1 = require("../../../util/index.js");
const node_1 = require("./node");
const leaf_node_1 = require("./leaf-node");
function fmtBlockDeclaration(node, options, namespace) {
    return node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.IDENTIFIER: {
                return [
                    {
                        ...(0, node_1.fmtNode1)(child, options),
                        widthMatching: {
                            namespace,
                            group: "identifier",
                        },
                    },
                    { text: " ", range: (0, _util_1.toDocumentRange)(child) },
                ];
            }
            case _util_1.GRAMMAR.RULE.SEMICOLON_PUNCTUATION: {
                return [
                    {
                        text: (0, leaf_node_1.textForLeafNode)(child),
                        newLine: true,
                        range: (0, _util_1.toDocumentRange)(child),
                    },
                ];
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
function fmtBlockDeclarationList(node, options) {
    const namespace = node.id.toFixed(0);
    const parts = node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.BLOCK_DECLARATION: {
                return fmtBlockDeclaration(child, options, namespace);
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
    return parts;
}
//# sourceMappingURL=block-declaration-list.js.map