"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmtParamDeclarationList = fmtParamDeclarationList;
const _util_1 = require("../../../util/index.js");
const util_1 = require("./util");
const node_1 = require("./node");
function fmtParamDeclaration(node, options, namespace) {
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
            case _util_1.GRAMMAR.RULE.TYPE: {
                return [
                    {
                        ...(0, node_1.fmtNode1)(child, options),
                        widthMatching: {
                            namespace,
                            group: "type",
                        },
                    },
                ];
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
}
function fmtParamDeclarationList(node, options) {
    const namespace = node.id.toFixed(0);
    const parts = node.children.flatMap((child) => {
        switch (child.type) {
            case _util_1.GRAMMAR.RULE.PARAM_DECLARATION: {
                const parts = fmtParamDeclaration(child, options, namespace);
                if (child.nextSibling === null) {
                    parts.at(-1).break = { indentAfter: 0 };
                }
                return parts;
            }
            case _util_1.GRAMMAR.RULE.COMMA_PUNCTUATION: {
                return [{ ...(0, util_1.spaceAfterPart)(child, options), break: true }];
            }
            default: {
                return (0, node_1.fmtNode)(child, options);
            }
        }
    });
    return parts;
}
//# sourceMappingURL=param-declaration-list.js.map