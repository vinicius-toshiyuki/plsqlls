"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fmt = fmt;
exports.getOnDocumentRangeFormattingHandler = getOnDocumentRangeFormattingHandler;
exports.getOnDocumentFormattingHandler = getOnDocumentFormattingHandler;
const _util_1 = require("../../util/index.js");
const tree_sitter_1 = require("tree-sitter");
const binding_1 = __importDefault(require("../../treesitter-parser/binding.js"));
const TEXT_WRAP_LENGTH = 120;
const DEFAULT_OPTIONS = {
    insertSpaces: true,
    tabSize: 4,
};
const UPPER_CASE_TYPES = [
    _util_1.GRAMMAR.RULE.BUILTIN_PROGRAM,
    _util_1.GRAMMAR.RULE.BUILTIN_TYPE,
    _util_1.GRAMMAR.RULE.CONSTANT,
    _util_1.GRAMMAR.RULE.BOOLEAN,
    ..._util_1.OPERATOR_NODE_TYPES,
    ..._util_1.KEYWORD_NODE_TYPES,
];
function fmtNode(node) {
    if (UPPER_CASE_TYPES.includes(node.type)) {
        return node.text.toUpperCase();
    }
    else if (node.type === _util_1.GRAMMAR.RULE.UDT) {
        return node.text.toLowerCase();
    }
    else if (node.type === _util_1.GRAMMAR.RULE.TYPE) {
        const typeQuery = new tree_sitter_1.Query(binding_1.default, `[(builtin_type) (udt)] @type`);
        const [capture] = typeQuery.captures(node);
        if (capture.node.type === _util_1.GRAMMAR.RULE.BUILTIN_TYPE) {
            return capture.node.text.toUpperCase();
        }
        else {
            return capture.node.text.toLowerCase();
        }
    }
    else if (node.type === _util_1.GRAMMAR.RULE.IDENTIFIER) {
        if (node.previousSibling?.type === _util_1.GRAMMAR.RULE.COLON_PUNCTUATION) {
            return node.text.toUpperCase();
        }
        else if (node.text.startsWith('"') && node.text.endsWith('"')) {
            return node.text;
        }
        return node.text.toLowerCase();
    }
    else {
        return node.text;
    }
}
function fmt() {
    if (arguments.length === 1 && !Array.isArray(arguments[0])) {
        const options = arguments[0];
        return fmt.bind({ options });
    }
    const options = typeof this === "object" && "options" in this
        ? this.options
        : DEFAULT_OPTIONS;
    const [strings, ...expressions] = [...arguments];
    let text = strings.raw[0]
        .split(/\r?\n/)
        .map((s) => s.trimStart())
        .join("")
        .split(/\\n/)
        .join("\n");
    strings.raw.slice(1).forEach((str, i) => {
        const expression = expressions[i];
        let expressionText;
        if (typeof expression === "number") {
            expressionText = options.insertSpaces
                ? "".padStart(expression * options.tabSize)
                : "".padStart(expression, "\t");
        }
        else if ((0, _util_1.isSyntaxNode)(expression)) {
            expressionText = fmtNode(expression);
        }
        else if (typeof expression === "object" &&
            "node" in expression &&
            "name" in expression &&
            (0, _util_1.isSyntaxNode)(expression.node)) {
            expressionText = fmtNode(expression.node);
        }
        else {
            expressionText = String(expression);
        }
        text +=
            expressionText +
                str
                    .split(/\r?\n/)
                    .map((s, index) => index === 0 && expressionText.at(-1) !== "\n" ? s : s.trimStart())
                    .join("")
                    .split(/\\n/)
                    .join("\n");
    });
    return text;
}
function formatFunctionDefinitionHeaders(root, options, range) {
    const edits = [];
    const functionDefinitionQuery = new tree_sitter_1.Query(binding_1.default, `(function_definition
      (function_keyword) @function
      program_name: (identifier) @name
      (parenthesis_bracket__open) @open_params
      (param_declaration_list)? @params
      (parenthesis_bracket__close) @close_params
      (return_keyword) @return
      return_type: (type) @type
      (is_keyword) @is) @root`);
    for (const match of functionDefinitionQuery.matches(root)) {
        const { root: headerCapture, function: functionCapture, name: nameCapture, open_params: openCapture, params: paramsCapture, close_params: closeCapture, return: returnCapture, type: typeCapture, is: isCapture, } = {
            params: null,
            ...Object.fromEntries(match.captures.map((capture) => [capture.name, capture])),
        };
        const firstNode = functionCapture.node;
        const lastNode = isCapture.node;
        if (range &&
            !(0, _util_1.isRangeContained)((0, _util_1.toDocumentRange)(firstNode, lastNode), range)) {
            continue;
        }
        const identation = (0, _util_1.getIdentationLevel)(headerCapture.node);
        const nextIdentation = identation + 1;
        const isSharingLine = headerCapture.node.previousSibling?.endPosition.row ===
            headerCapture.node.startPosition.row;
        let inlineText = fmt(options) `
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${functionCapture.node} ${nameCapture.node}
      ${openCapture.node}
    `;
        let text = fmt(options) `
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${functionCapture.node} ${nameCapture.node}
      ${openCapture.node}\n
    `;
        if (paramsCapture) {
            const paramQuery = new tree_sitter_1.Query(binding_1.default, `(param_declaration
           declaration_identifier: (identifier) @name
           [
             (in_keyword__param)
             (out_keyword__param)
           ]? @inOut
           (type) @type)`);
            const parts = paramQuery
                .matches(paramsCapture.node)
                .map(({ captures }) => {
                if (captures.length === 2) {
                    const [$name, $type] = captures;
                    return [$name, $type];
                }
                const [$name, $inOut, $type] = captures;
                return [$name, $type, $inOut];
            });
            const maxLength = Math.max(...parts.map(([$name]) => $name.node.text.length));
            const inOutPaddingLength = Math.max(...parts.map(([, , $inOut]) => $inOut?.node.text.length ?? -1));
            const hasInOut = inOutPaddingLength >= 0;
            const texts = parts.map(([$name, $type, $inOut], index) => {
                const padding = "".padEnd(maxLength - $name.node.text.length);
                const inOut = $inOut ?? "IN";
                const inOutPadding = "".padStart(hasInOut
                    ? inOutPaddingLength -
                        (typeof inOut === "string"
                            ? inOut.length
                            : inOut.node.text.length)
                    : 0);
                const inlineText = fmt(options) `
          ${index === 0 ? "" : ", "}
          ${$name.node}${hasInOut ? fmt `${" "}${inOut}${inOutPadding}` : ""} ${$type.node}
        `;
                const text = fmt(options) `
          ${index === 0 ? "" : ",\n"}
          ${nextIdentation}
          ${$name.node}${padding}${hasInOut ? fmt `${" "}${inOut}${inOutPadding}` : ""} ${$type.node}
        `;
                return [inlineText, text];
            });
            inlineText += texts.map(([text]) => text).join("");
            text += texts.map(([_, text]) => text).join("");
        }
        inlineText += fmt(options) `
      ${closeCapture.node} ${returnCapture.node} ${typeCapture.node}\n
      ${identation}${isCapture.node}
    `;
        text += fmt(options) `
      \n${identation}
      ${closeCapture.node} ${returnCapture.node} ${typeCapture.node}\n
      ${identation}
      ${isCapture.node}
    `;
        edits.push({
            range: {
                start: {
                    line: firstNode.startPosition.row,
                    character: isSharingLine
                        ? headerCapture.node.previousSibling.endPosition.column
                        : 0,
                },
                end: (0, _util_1.toDocumentPosition)(lastNode.endPosition),
            },
            newText: inlineText.length > TEXT_WRAP_LENGTH ? text : inlineText,
        });
    }
    return edits;
}
function formatBlockDeclarations(root, options, range) {
    const edits = [];
    const blockQuery = new tree_sitter_1.Query(binding_1.default, `(block_statement
      (declare_keyword)
      (block_declaration
       declaration_identifier: (identifier) @name)* @declaration) @block`);
    const declarationQuery = new tree_sitter_1.Query(binding_1.default, `(block_declaration
      declaration_identifier: (identifier) @name
      (constant_keyword)? @constant
      (type) @type
      (assign_operator)? @operator
      .
      (expression)? @expression
      (semicolon_punctuation) @semicolon) @root`);
    const blockMatches = blockQuery.matches(root);
    for (const match of blockMatches) {
        const blockCapture = match.captures.find((capture) => capture.name === "block");
        if (!blockCapture) {
            continue;
        }
        const matches = declarationQuery.matches(blockCapture.node);
        const maxLength = Math.max(...matches
            .flatMap((match) => match.captures)
            .filter((capture) => capture.name === "name")
            .map((capture) => capture.node.text.length));
        for (const match of matches) {
            const { $root, $name, $constant, $type, $operator, $expression, $semicolon, } = {
                $constant: null,
                $operator: null,
                $expression: null,
                ...Object.fromEntries(match.captures.map((capture) => ["$" + capture.name, capture])),
            };
            const firstNode = $name.node;
            const lastNode = $semicolon.node;
            if (range &&
                !(0, _util_1.isRangeContained)((0, _util_1.toDocumentRange)(firstNode, lastNode), range)) {
                continue;
            }
            const identation = (0, _util_1.getIdentationLevel)($name.node);
            const nextIdentation = identation + 1;
            const isSharingLine = $root.node.previousSibling?.endPosition.row ===
                $root.node.startPosition.row;
            const padding = "".padStart(maxLength - $name.node.text.length);
            const inlineText = fmt(options) `
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${$name}${padding}${$constant ? fmt ` ${$constant}` : ""} ${$type}
      ${$operator ? " " + fmt `${$operator} ${$expression}` : ""}
      ${$semicolon}
    `;
            const text = fmt(options) `
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${$name}${padding}${$constant ? fmt ` ${$constant}` : ""} ${$type}\n
      ${nextIdentation}
      ${$operator ? " " + fmt `${$operator} ${$expression}` : ""}
      ${$semicolon}
    `;
            edits.push({
                range: {
                    start: {
                        line: firstNode.startPosition.row,
                        character: isSharingLine
                            ? $root.node.previousSibling.endPosition.column
                            : 0,
                    },
                    end: (0, _util_1.toDocumentPosition)(lastNode.endPosition),
                },
                newText: inlineText.length > TEXT_WRAP_LENGTH ? text : inlineText,
            });
        }
    }
    return edits;
}
function formatUpperLowerCase(root, options, range) {
    const edits = [];
    (0, _util_1.walkBreadth)(root, (node) => {
        const nodeRange = (0, _util_1.toDocumentRange)(node);
        if (range && !(0, _util_1.isRangeContained)(range, nodeRange)) {
            return false;
        }
        const newText = fmt(options) `${node}`;
        if (newText !== node.text) {
            edits.push({
                newText,
                range: nodeRange,
            });
        }
        return false;
    });
    return edits;
}
function formatFromGrammar(tree, options, range) {
    const edits = [];
    // if (options.trimTrailingWhitespace ?? true) {
    //   const newText = tree.rootNode.text.replace(/\s+\r?$/g, "");
    //   edits.push({
    //     newText,
    //     range: toDocumentRange(tree.rootNode),
    //   });
    // }
    edits.push(...formatFunctionDefinitionHeaders(tree.rootNode, options, range));
    edits.push(...formatBlockDeclarations(tree.rootNode, options, range));
    edits.push(...formatUpperLowerCase(tree.rootNode, options, range));
    return edits;
}
function getOnDocumentRangeFormattingHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return [];
        }
        const edits = formatFromGrammar(tree, params.options, params.range);
        return edits;
    };
}
function getOnDocumentFormattingHandler(context) {
    return (params) => {
        const tree = context.trees[params.textDocument.uri];
        if (!tree) {
            return [];
        }
        const edits = formatFromGrammar(tree, params.options);
        return edits;
    };
}
//# sourceMappingURL=index.js.map