"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIAGNOSTIC_CODE = void 0;
exports.getOnDiagnosticsHandler = getOnDiagnosticsHandler;
const _util_1 = require("../../util/index.js");
const vscode_languageserver_1 = require("vscode-languageserver");
const declaration_1 = require("../declaration");
const util_1 = require("../../util");
var DIAGNOSTIC_CODE;
(function (DIAGNOSTIC_CODE) {
    DIAGNOSTIC_CODE[DIAGNOSTIC_CODE["SYNTAX_ERROR"] = 0] = "SYNTAX_ERROR";
    DIAGNOSTIC_CODE[DIAGNOSTIC_CODE["UNDEFINED_IDENTIFIER"] = 1] = "UNDEFINED_IDENTIFIER";
    DIAGNOSTIC_CODE[DIAGNOSTIC_CODE["UNUSED_REFERENCE"] = 2] = "UNUSED_REFERENCE";
})(DIAGNOSTIC_CODE || (exports.DIAGNOSTIC_CODE = DIAGNOSTIC_CODE = {}));
function getSyntaxDiagnostics(tree) {
    const diagnostics = [];
    (0, _util_1.walkBreadth)(tree.rootNode, (node) => {
        if (node.isError) {
            diagnostics.push({
                range: (0, _util_1.toDocumentRange)(node),
                message: "Syntax Error",
                code: DIAGNOSTIC_CODE.SYNTAX_ERROR,
            });
        }
        return false;
    });
    return diagnostics;
}
function getUndefinedDiagnostics(tree, context, config) {
    const diagnostics = [];
    (0, _util_1.walkBreadth)(tree.rootNode, (node) => {
        if (!_util_1.BUILTIN_NODE_TYPES.includes(node.type) &&
            (0, _util_1.isReference)(node) &&
            node.previousSibling?.type !== _util_1.GRAMMAR.RULE.COLON_PUNCTUATION &&
            (0, declaration_1.getDeclaration)(node, context) === null &&
            (!config || (0, util_1.isExternalSymbol)(config, node.text))) {
            diagnostics.push({
                range: (0, _util_1.toDocumentRange)(node),
                message: "Undefined identifier",
                code: DIAGNOSTIC_CODE.UNDEFINED_IDENTIFIER,
                data: {
                    identifier: node.text,
                },
            });
        }
        return false;
    });
    return diagnostics;
}
function getUnusedDiagnostics(tree, context) {
    const diagnostics = [];
    (0, _util_1.walkBreadth)(tree.rootNode, (node) => {
        const nodeBefore = (0, _util_1.getNodeBefore)(node);
        if (nodeBefore?.type === _util_1.GRAMMAR.RULE.COMMENT &&
            nodeBefore.text.replace(/^--(.*)$|^\/\*(.*)\*\/$/, "$1").trim() ===
                "plsqlls: ignore") {
            return false;
        }
        const symbol = (0, _util_1.getSymbol)(node, context.symbols);
        if (symbol &&
            node.previousSibling?.type !== _util_1.GRAMMAR.RULE.COLON_PUNCTUATION &&
            (symbol.declaration ?? symbol.definition) !== null) {
            const isUnused = symbol.references.filter((ref) => ref.node.id !== symbol.definition?.node.id &&
                ref.node.id !== symbol.declaration?.node.id).length === 0;
            if (!isUnused) {
                return false;
            }
            // TODO: re-enable after implementing locating declarations
            // if (symbol.declaration) {
            //   diagnostics.push({
            //     range: toDocumentRange(symbol.declaration.node),
            //     message: "Unused reference",
            //     code: DIAGNOSTIC_CODE.UNUSED_REFERENCE,
            //     severity: DiagnosticSeverity.Hint,
            //     tags: [DiagnosticTag.Unnecessary],
            //     data: {
            //       identifier: getIdentifierKey(symbol.declaration.node),
            //     },
            //   });
            // }
            if (symbol.definition) {
                diagnostics.push({
                    range: (0, _util_1.toDocumentRange)(symbol.definition.node),
                    message: "Unused reference",
                    code: DIAGNOSTIC_CODE.UNUSED_REFERENCE,
                    severity: vscode_languageserver_1.DiagnosticSeverity.Hint,
                    tags: [vscode_languageserver_1.DiagnosticTag.Unnecessary],
                    data: {
                        identifier: (0, _util_1.getIdentifierKey)(symbol.definition.node),
                    },
                });
            }
        }
        return false;
    });
    return diagnostics;
}
function getOnDiagnosticsHandler(context) {
    return (params) => {
        const uri = params.textDocument.uri;
        const tree = context.trees[uri];
        const config = context.configs[uri];
        if (!tree) {
            return {
                kind: vscode_languageserver_1.DocumentDiagnosticReportKind.Full,
                items: [],
            };
        }
        const diagnostics = [
            ...getSyntaxDiagnostics(tree),
            ...getUndefinedDiagnostics(tree, context, config),
            ...getUnusedDiagnostics(tree, context),
        ];
        return {
            kind: vscode_languageserver_1.DocumentDiagnosticReportKind.Full,
            items: diagnostics,
        };
    };
}
//# sourceMappingURL=index.js.map