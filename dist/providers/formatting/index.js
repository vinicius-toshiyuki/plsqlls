"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnDocumentRangeFormattingHandler = getOnDocumentRangeFormattingHandler;
exports.getOnDocumentFormattingHandler = getOnDocumentFormattingHandler;
const _util_1 = require("../../util/index.js");
const vscode_languageserver_1 = require("vscode-languageserver");
const node_1 = require("./formatters/node");
const util_1 = require("./formatters/util");
const TEXT_WRAP_LENGTH = 120;
function getFormatOptions(lspOptions) {
    return {
        maxLength: TEXT_WRAP_LENGTH,
        ...(lspOptions.insertSpaces
            ? {
                indentText: " ",
                indentAmount: lspOptions.tabSize,
            }
            : {
                indentText: "\t",
                indentAmount: 1,
            }),
    };
}
function notifyError(e) {
    this.sendMessage(vscode_languageserver_1.MessageType.Error, e instanceof Error ? `[${e.name}] ${e.message}\n${e.stack}` : String(e));
}
function format(node, options, range) {
    const newText = (0, util_1.buildParts)((0, node_1.fmtNode)(node, options), options, range);
    return [{ newText, range }];
}
function getOnDocumentRangeFormattingHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return [];
        }
        const options = getFormatOptions(params.options);
        try {
            return format(tree.rootNode, options, params.range);
        }
        catch (e) {
            notifyError.bind(context)(e);
        }
        return [];
    };
}
function getOnDocumentFormattingHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return [];
        }
        const options = getFormatOptions(params.options);
        try {
            return format(tree.rootNode, options, (0, _util_1.toDocumentRange)(tree.rootNode));
        }
        catch (e) {
            notifyError.bind(context)(e);
        }
        return [];
    };
}
//# sourceMappingURL=index.js.map