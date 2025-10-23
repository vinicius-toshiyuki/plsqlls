"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnCodeActionHandler = getOnCodeActionHandler;
const diagnostics_1 = require("../diagnostics/index.js");
const _util_1 = require("../../util/index.js");
const vscode_languageserver_1 = require("vscode-languageserver");
function getAddScopeDeclarationAction(node, identifierName, textDocument) {
    const scope = (0, _util_1.getContainingScope)(node);
    if (!scope) {
        return null;
    }
    let insertBeforeNode;
    let newText;
    if (_util_1.PROGRAM_DEFINITION_TYPES.includes(scope.type)) {
        const beginNode = scope.children.find((child) => child.type === _util_1.GRAMMAR.RULE.BEGIN_KEYWORD);
        insertBeforeNode = beginNode;
        newText = `${identifierName} VARCHAR2(4000);\n`;
    }
    else if (scope.type === _util_1.SCOPE_NODE.BLOCK_STATEMENT) {
        const [beginNode] = scope.descendantsOfType(_util_1.GRAMMAR.RULE.BEGIN_KEYWORD);
        insertBeforeNode = beginNode;
        if (!scope.children.some((child) => child.type === "declare_keyword")) {
            newText = `DECLARE\n${identifierName} VARCHAR2(4000);\n`;
        }
        else {
            newText = `${identifierName} VARCHAR2(4000);\n`;
        }
    }
    if (!insertBeforeNode || newText === undefined) {
        return null;
    }
    return {
        title: `Add declaration for "${identifierName}"`,
        edit: {
            changes: {
                [textDocument.uri]: [
                    {
                        range: {
                            start: (0, _util_1.toDocumentPosition)(insertBeforeNode.startPosition),
                            end: (0, _util_1.toDocumentPosition)(insertBeforeNode.startPosition),
                        },
                        newText,
                    },
                ],
            },
        },
    };
}
function getAddParameterDeclarationAction(node, identifierName, textDocument) {
    let scope = (0, _util_1.getContainingScope)(node);
    while (scope && !_util_1.PROGRAM_DEFINITION_TYPES.includes(scope.type)) {
        scope = (0, _util_1.getContainingScope)(scope);
    }
    if (!scope) {
        return null;
    }
    const insertBeforeNode = scope.children.find((child) => child.type === _util_1.GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE);
    const previousSibling = insertBeforeNode?.previousSibling;
    const hasOtherParameters = previousSibling?.type === _util_1.GRAMMAR.RULE.PARAM_DECLARATION_LIST;
    const programName = scope.childForFieldName(_util_1.GRAMMAR.FIELD.PROGRAM_NAME)?.text;
    const newText = `${hasOtherParameters ? ",\n" : ""}${identifierName} VARCHAR2\n`;
    if (!insertBeforeNode || programName === undefined) {
        return null;
    }
    return {
        title: `Add parameter "${identifierName}" to ${programName}`,
        edit: {
            changes: {
                [textDocument.uri]: [
                    {
                        range: {
                            start: (0, _util_1.toDocumentPosition)(previousSibling?.endPosition ?? insertBeforeNode.startPosition),
                            end: (0, _util_1.toDocumentPosition)(insertBeforeNode.startPosition),
                        },
                        newText,
                    },
                ],
            },
        },
    };
}
function getOnCodeActionHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return null;
        }
        const actions = [];
        for (const diagnostic of params.context.diagnostics) {
            if (diagnostic.code === diagnostics_1.DIAGNOSTIC_CODE.UNDEFINED_IDENTIFIER) {
                const node = (0, _util_1.getDeepestNodeAtPosition)(tree.rootNode, params.range.start);
                if (!node) {
                    continue;
                }
                const scopeDeclarationAction = getAddScopeDeclarationAction(node, diagnostic.data.identifier, params.textDocument);
                if (scopeDeclarationAction) {
                    actions.push({
                        ...scopeDeclarationAction,
                        kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                        diagnostics: [diagnostic],
                    });
                }
                const parameterDeclarationAction = getAddParameterDeclarationAction(node, diagnostic.data.identifier, params.textDocument);
                if (parameterDeclarationAction) {
                    actions.push({
                        ...parameterDeclarationAction,
                        kind: vscode_languageserver_1.CodeActionKind.QuickFix,
                        diagnostics: [diagnostic],
                    });
                }
            }
        }
        return actions;
    };
}
//# sourceMappingURL=index.js.map