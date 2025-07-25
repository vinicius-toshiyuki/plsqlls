"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRAM_DEFINITION_TYPES = exports.SCOPE_NODE_TYPES = exports.SCOPE_NODE = exports.IDENTATION_NODE = exports.OPERATOR_NODE_TYPES = exports.OPERATOR_NODE = exports.KEYWORD_NODE_TYPES = exports.KEYWORD_NODE = exports.GRAMMAR = void 0;
exports.walkDepthFirst = walkDepthFirst;
exports.walkDepthLast = walkDepthLast;
exports.walkBreadth = walkBreadth;
exports.getNodeRange = getNodeRange;
exports.toDocumentPosition = toDocumentPosition;
exports.toTreeSitterPosition = toTreeSitterPosition;
exports.toDocumentRange = toDocumentRange;
exports.isRangeOverlap = isRangeOverlap;
exports.isRangeContained = isRangeContained;
exports.getDeepestNodeAtPosition = getDeepestNodeAtPosition;
exports.isScopeNode = isScopeNode;
exports.getContainingScope = getContainingScope;
exports.isReference = isReference;
exports.getReferences = getReferences;
exports.isExternalSymbol = isExternalSymbol;
exports.getIdentationLevel = getIdentationLevel;
exports.isSyntaxNode = isSyntaxNode;
exports.getLastLineRange = getLastLineRange;
exports.getScopeId = getScopeId;
exports.getIdentifierKey = getIdentifierKey;
exports.getSymbol = getSymbol;
const declaration_1 = require("../providers/declaration/index.js");
const grammar_constants_1 = require("./grammar-constants");
var grammar_constants_2 = require("./grammar-constants");
Object.defineProperty(exports, "GRAMMAR", { enumerable: true, get: function () { return grammar_constants_2.GRAMMAR; } });
exports.KEYWORD_NODE = Object.fromEntries(Object.entries(grammar_constants_1.GRAMMAR.RULE).filter(([key]) => key.match(/KEYWORD/)));
exports.KEYWORD_NODE_TYPES = Object.values(exports.KEYWORD_NODE);
exports.OPERATOR_NODE = Object.fromEntries(Object.entries(grammar_constants_1.GRAMMAR.RULE).filter(([key]) => key.match(/OPERATOR/)));
exports.OPERATOR_NODE_TYPES = Object.values(exports.OPERATOR_NODE);
exports.IDENTATION_NODE = {
    FUNCTION_DEFINITION: grammar_constants_1.GRAMMAR.RULE.FUNCTION_DEFINITION,
    PROCEDURE_DEFINITION: "" /* GRAMMAR.RULE.PROCEDURE_DEFINITION */,
    BLOCK_STATEMENT: grammar_constants_1.GRAMMAR.RULE.BLOCK_STATEMENT,
    FOR_STATEMENT: grammar_constants_1.GRAMMAR.RULE.FOR_STATEMENT,
    LOOP_STATEMENT: grammar_constants_1.GRAMMAR.RULE.LOOP_STATEMENT,
    CASE_STATEMENT: grammar_constants_1.GRAMMAR.RULE.CASE_STATEMENT,
    IF_STATEMENT: grammar_constants_1.GRAMMAR.RULE.IF_STATEMENT,
};
exports.SCOPE_NODE = {
    SOURCE_FILE: grammar_constants_1.GRAMMAR.RULE.SOURCE_FILE,
    FUNCTION_DEFINITION: grammar_constants_1.GRAMMAR.RULE.FUNCTION_DEFINITION,
    PROCEDURE_DEFINITION: "" /* GRAMMAR.RULE.PROCEDURE_DEFINITION */,
    BLOCK_STATEMENT: grammar_constants_1.GRAMMAR.RULE.BLOCK_STATEMENT,
    FOR_STATEMENT: grammar_constants_1.GRAMMAR.RULE.FOR_STATEMENT,
    FORALL_STATEMENT: grammar_constants_1.GRAMMAR.RULE.FORALL_STATEMENT,
    SELECT: grammar_constants_1.GRAMMAR.RULE.SELECT,
};
exports.SCOPE_NODE_TYPES = Object.values(exports.SCOPE_NODE);
exports.PROGRAM_DEFINITION_TYPES = [
    exports.SCOPE_NODE.FUNCTION_DEFINITION,
    exports.SCOPE_NODE.PROCEDURE_DEFINITION,
];
function walkDepthFirst(root, callback) {
    let shouldStop = callback(root);
    if (shouldStop) {
        return;
    }
    for (const currentNode of root.children) {
        walkDepthFirst(currentNode, callback);
    }
}
function walkDepthLast(root, callback) {
    let shouldStop = false;
    for (const currentNode of root.children) {
        walkDepthLast(currentNode, (node) => {
            shouldStop || (shouldStop = callback(node));
            return shouldStop;
        });
        if (shouldStop) {
            break;
        }
    }
    if (!shouldStop) {
        callback(root);
    }
}
function walkBreadth(root, callback) {
    const next = [[root, 0]];
    while (next.length) {
        const [node, depth] = next.shift();
        const newDepth = node.type === "block_declaration" ? depth + 1 : depth;
        next.push(...node.children.map((child) => [child, newDepth]));
        const shouldStop = callback(node, depth);
        if (shouldStop) {
            break;
        }
    }
}
/** @deprecated Use {@link toDocumentRange} */
function getNodeRange(node) {
    return {
        start: {
            line: node.startPosition.row,
            character: node.startPosition.column,
        },
        end: { line: node.endPosition.row, character: node.endPosition.column },
    };
}
function toDocumentPosition(point) {
    return {
        line: point.row,
        character: point.column,
    };
}
function toTreeSitterPosition(position) {
    return {
        row: position.line,
        column: position.character,
    };
}
function toDocumentRange() {
    let start;
    let end;
    if (arguments.length === 1) {
        start = arguments[0].startPosition;
        end = arguments[0].endPosition;
    }
    else {
        start = arguments[0].startPosition;
        end = arguments[1].endPosition;
    }
    return {
        start: {
            line: start.row,
            character: start.column,
        },
        end: {
            line: end.row,
            character: end.column,
        },
    };
}
function isPositionContained(position, within) {
    return ((position.line > within.start.line ||
        (position.line === within.start.line &&
            position.character >= within.start.character)) &&
        (position.line < within.end.line ||
            (position.line === within.end.line &&
                position.character <= within.end.character)));
}
function isRangeOverlap(range1, range2) {
    const isStartOverlap = isPositionContained(range1.start, range2);
    const isEndOverlap = isPositionContained(range1.end, range2);
    return isStartOverlap || isEndOverlap;
}
function isRangeContained(range, within) {
    const isStartOverlap = isPositionContained(range.start, within);
    const isEndOverlap = isPositionContained(range.end, within);
    return isStartOverlap && isEndOverlap;
}
/**
 * @deprecated
 */
function getDeepestNodeAtPosition(root, position) {
    const positionRange = {
        start: position,
        end: position,
    };
    let deepestNode = root;
    walkBreadth(root, (currentNode) => {
        const nodeRange = {
            start: toDocumentPosition(currentNode.startPosition),
            end: toDocumentPosition(currentNode.endPosition),
        };
        if (!isRangeOverlap(positionRange, nodeRange)) {
            return false;
        }
        if (currentNode.children.length) {
            return false;
        }
        deepestNode = currentNode;
        return true;
    });
    return deepestNode;
}
function isScopeNode(node) {
    return exports.SCOPE_NODE_TYPES.includes(node.type);
}
function getContainingScope(node) {
    let currentNode = node;
    // If the node is a program name, the scope is the one above the program
    // scope
    if (currentNode.parent?.childForFieldName(grammar_constants_1.GRAMMAR.FIELD.PROGRAM_NAME)?.id ===
        currentNode.id &&
        currentNode.parent.parent) {
        currentNode = currentNode.parent.parent;
    }
    while (true) {
        if (isScopeNode(currentNode) && currentNode.id !== node.id) {
            return currentNode;
        }
        if (!currentNode.parent) {
            return null;
        }
        currentNode = currentNode.parent;
    }
}
function isReference(node) {
    return (node.parent?.childForFieldName(grammar_constants_1.GRAMMAR.FIELD.DECLARATION_IDENTIFIER)?.id ===
        node.id ||
        node.parent?.childForFieldName(grammar_constants_1.GRAMMAR.FIELD.ACCESSOR_IDENTIFIER)?.id ===
            node.id ||
        node.parent?.childForFieldName(grammar_constants_1.GRAMMAR.FIELD.PROGRAM_NAME)?.id === node.id);
}
function getReferences(node) {
    const references = [];
    const scope = getContainingScope(node);
    const declarationNode = (0, declaration_1.getDeclaration)(node);
    if (!declarationNode || !scope) {
        return [];
    }
    walkDepthLast(scope, (currentNode) => {
        if (isReference(currentNode) &&
            declarationNode === (0, declaration_1.getDeclaration)(currentNode)) {
            references.push(currentNode);
        }
        return false;
    });
    return references;
}
function isExternalSymbol(config, name) {
    return (!!config.external &&
        config.external.every((symbol) => typeof symbol === "string"
            ? symbol.toLowerCase() !== name.toLowerCase()
            : symbol.name.toLowerCase() !== name.toLowerCase()));
}
function getIdentationLevel(node) {
    let level = 0;
    let currentNode = node;
    while (currentNode.parent) {
        currentNode = currentNode.parent;
        if (Object.values(exports.IDENTATION_NODE).includes(currentNode.type)) {
            level++;
        }
    }
    return level;
}
function isSyntaxNode(value) {
    const coreProperties = [
        "id",
        "type",
        "typeId",
        "text",
        "startPosition",
        "startIndex",
        "endPosition",
        "endIndex",
        "parent",
        "parseState",
        "nextParseState",
    ];
    return (typeof value === "object" && coreProperties.every((prop) => prop in value));
}
function getLastLineRange(range) {
    if (range.start.line !== range.end.line) {
        return {
            start: {
                line: range.end.line,
                character: 0,
            },
            end: range.end,
        };
    }
    return range;
}
function getScopeId(scope) {
    return scope.type === grammar_constants_1.GRAMMAR.RULE.SOURCE_FILE ? "global" : scope.id;
}
function getIdentifierKey(node) {
    return node.text.toLowerCase();
}
function getSymbol(node, symbols) {
    if (!isReference(node)) {
        return null;
    }
    const identifierKey = getIdentifierKey(node);
    let scopeNode = getContainingScope(node);
    while (scopeNode) {
        const scopeId = getScopeId(scopeNode);
        const scope = scopeId === "global" ? symbols.global : symbols.scopes[scopeId];
        if (identifierKey in scope) {
            return scope[identifierKey];
        }
        scopeNode = getContainingScope(scopeNode);
    }
    return null;
}
//# sourceMappingURL=index.js.map