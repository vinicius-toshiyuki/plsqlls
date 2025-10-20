import {
  Point,
  QueryCapture,
  SyntaxNode,
  Range as TreeSitterRange,
} from "tree-sitter";
import { Range as DocumentRange, Position } from "vscode-languageserver";
import { getDeclaration } from "@providers/declaration";
import { LanguageSymbol, ServerConfig, SymbolMap } from "@types";
import { GRAMMAR } from "./grammar-constants";

export { GRAMMAR } from "./grammar-constants";

export const BUILTIN_NODE = Object.fromEntries(
  Object.entries(GRAMMAR.RULE).filter(([key]) => key.match(/BUILTIN/)),
);
export const BUILTIN_NODE_TYPES = Object.values(BUILTIN_NODE);

export const KEYWORD_NODE = Object.fromEntries(
  Object.entries(GRAMMAR.RULE).filter(([key]) => key.match(/KEYWORD/)),
);
export const KEYWORD_NODE_TYPES = Object.values(KEYWORD_NODE);

export const OPERATOR_NODE = Object.fromEntries(
  Object.entries(GRAMMAR.RULE).filter(([key]) => key.match(/OPERATOR/)),
);
export const OPERATOR_NODE_TYPES = Object.values(OPERATOR_NODE);

export const IDENTATION_NODE = {
  FUNCTION_DEFINITION: GRAMMAR.RULE.FUNCTION_DEFINITION,
  PROCEDURE_DEFINITION: GRAMMAR.RULE.PROCEDURE_DEFINITION,
  BLOCK_STATEMENT: GRAMMAR.RULE.BLOCK_STATEMENT,
  FOR_STATEMENT: GRAMMAR.RULE.FOR_STATEMENT,
  LOOP_STATEMENT: GRAMMAR.RULE.LOOP_STATEMENT,
  CASE_STATEMENT: GRAMMAR.RULE.CASE_STATEMENT,
  IF_STATEMENT: GRAMMAR.RULE.IF_STATEMENT,
};

export const SCOPE_NODE = {
  SOURCE_FILE: GRAMMAR.RULE.SOURCE_FILE,
  FUNCTION_DEFINITION: GRAMMAR.RULE.FUNCTION_DEFINITION,
  PROCEDURE_DEFINITION: GRAMMAR.RULE.PROCEDURE_DEFINITION,
  BLOCK_STATEMENT: GRAMMAR.RULE.BLOCK_STATEMENT,
  FOR_STATEMENT: GRAMMAR.RULE.FOR_STATEMENT,
  FORALL_STATEMENT: GRAMMAR.RULE.FORALL_STATEMENT,
  SELECT: GRAMMAR.RULE.SELECT,
  WITH_TABLE: GRAMMAR.RULE.WITH_TABLE,
  PACKAGE_BODY_STATEMENT: GRAMMAR.RULE.PACKAGE_BODY_STATEMENT,
};
export const SCOPE_NODE_TYPES = Object.values(SCOPE_NODE);
export const PROGRAM_DEFINITION_TYPES = [
  SCOPE_NODE.FUNCTION_DEFINITION,
  SCOPE_NODE.PROCEDURE_DEFINITION,
];

export function walkDepthFirst(
  root: SyntaxNode,
  callback: (node: SyntaxNode) => boolean,
): void {
  let shouldStop = callback(root);

  if (shouldStop) {
    return;
  }

  for (const currentNode of root.children) {
    walkDepthFirst(currentNode, callback);
  }
}
export function walkDepthLast(
  root: SyntaxNode,
  callback: (node: SyntaxNode) => boolean,
): void {
  let shouldStop = false;
  for (const currentNode of root.children) {
    walkDepthLast(currentNode, (node) => {
      shouldStop ||= callback(node);
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

export function walkBreadth(
  root: SyntaxNode,
  callback: (node: SyntaxNode, syntaxDepth: number) => boolean,
): void {
  const next: (readonly [SyntaxNode, number])[] = [[root, 0]];

  while (next.length) {
    const [node, depth] = next.shift() as (typeof next)[0];

    const newDepth =
      node.type === GRAMMAR.RULE.BLOCK_DECLARATION ? depth + 1 : depth;

    next.push(...node.children.map((child) => [child, newDepth] as const));
    const shouldStop = callback(node, depth);
    if (shouldStop) {
      break;
    }
  }
}

/** @deprecated Use {@link toDocumentRange} */
export function getNodeRange(node: SyntaxNode): DocumentRange {
  return {
    start: {
      line: node.startPosition.row,
      character: node.startPosition.column,
    },
    end: { line: node.endPosition.row, character: node.endPosition.column },
  };
}

export function toDocumentPosition(point: Point): Position {
  return {
    line: point.row,
    character: point.column,
  };
}

export function toTreeSitterPosition(position: Position): Point {
  return {
    row: position.line,
    column: position.character,
  };
}

export function toDocumentRange(node: SyntaxNode): DocumentRange;
export function toDocumentRange(
  startNode: SyntaxNode,
  endNode: SyntaxNode,
): DocumentRange;
export function toDocumentRange(range: TreeSitterRange): DocumentRange;
export function toDocumentRange(): DocumentRange {
  let start: Point;
  let end: Point;
  if (arguments.length === 1) {
    start = arguments[0].startPosition;
    end = arguments[0].endPosition;
  } else {
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

function isPositionContained(
  position: Position,
  within: DocumentRange,
): boolean {
  return (
    (position.line > within.start.line ||
      (position.line === within.start.line &&
        position.character >= within.start.character)) &&
    (position.line < within.end.line ||
      (position.line === within.end.line &&
        position.character <= within.end.character))
  );
}

export function isRangeOverlap(
  range1: DocumentRange,
  range2: DocumentRange,
): boolean {
  const isStartOverlap = isPositionContained(range1.start, range2);
  const isEndOverlap = isPositionContained(range1.end, range2);
  return isStartOverlap || isEndOverlap;
}

export function isRangeContained(
  range: DocumentRange,
  within: DocumentRange,
): boolean {
  const isStartOverlap = isPositionContained(range.start, within);
  const isEndOverlap = isPositionContained(range.end, within);
  return isStartOverlap && isEndOverlap;
}

/**
 * @deprecated
 */
export function getDeepestNodeAtPosition(
  root: SyntaxNode,
  position: Position,
): SyntaxNode {
  const positionRange: DocumentRange = {
    start: position,
    end: position,
  };
  let deepestNode: SyntaxNode = root;
  walkBreadth(root, (currentNode) => {
    const nodeRange: DocumentRange = {
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

export function isBuiltinNode(node: SyntaxNode): boolean {
  return BUILTIN_NODE_TYPES.includes(node.type);
}

export function isScopeNode(node: SyntaxNode): boolean {
  return SCOPE_NODE_TYPES.includes(node.type);
}

export function getContainingScope(node: SyntaxNode): SyntaxNode | null {
  let currentNode: SyntaxNode = node;

  // If the node is a program name, the scope is the one above the program
  // scope
  if (
    isField(currentNode, GRAMMAR.FIELD.PROGRAM_NAME) &&
    currentNode.parent?.parent
  ) {
    currentNode = currentNode.parent.parent;
  }

  while (true) {
    if (currentNode !== node && isScopeNode(currentNode)) {
      return currentNode;
    }

    if (!currentNode.parent) {
      return null;
    }
    currentNode = currentNode.parent;
  }
}

export function isField(node: SyntaxNode, fieldName: string): boolean {
  return !!node.parent?.childrenForFieldName(fieldName).includes(node);
}

export function isReference(node: SyntaxNode): boolean {
  return (
    isField(node, GRAMMAR.FIELD.DECLARATION_IDENTIFIER) ||
    isField(node, GRAMMAR.FIELD.PROGRAM_NAME) ||
    isField(node, GRAMMAR.FIELD.ACCESSOR_IDENTIFIER) ||
    isField(node, GRAMMAR.FIELD.TABLE_NAME) ||
    isField(node, GRAMMAR.FIELD.PACKAGE_IDENTIFIER)
  );
}

export function getReferences(node: SyntaxNode): SyntaxNode[] {
  const references: SyntaxNode[] = [];

  const scope = getContainingScope(node);
  const declarationNode = getDeclaration(node);
  if (!declarationNode || !scope) {
    return [];
  }

  walkDepthLast(scope, (currentNode) => {
    if (
      isReference(currentNode) &&
      declarationNode === getDeclaration(currentNode)
    ) {
      references.push(currentNode);
    }
    return false;
  });

  return references;
}

export function isExternalSymbol(config: ServerConfig, name: string): boolean {
  return (
    !!config.options.external &&
    config.options.external.every((symbol) =>
      typeof symbol === "string"
        ? symbol.toLowerCase() !== name.toLowerCase()
        : symbol.name.toLowerCase() !== name.toLowerCase(),
    )
  );
}

export function getIdentationLevel(node: SyntaxNode): number {
  let level = 0;
  let currentNode: SyntaxNode = node;

  while (currentNode.parent) {
    currentNode = currentNode.parent;
    if (Object.values(IDENTATION_NODE).includes(currentNode.type)) {
      level++;
    }
  }

  return level;
}

export function isSyntaxNode(value: any): value is SyntaxNode {
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
  return (
    typeof value === "object" && coreProperties.every((prop) => prop in value)
  );
}

export function getLastLineRange(range: DocumentRange): DocumentRange {
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

export function getScopeId(scope: SyntaxNode): number | "global" {
  return scope.type === GRAMMAR.RULE.SOURCE_FILE ? "global" : scope.id;
}

export function getGlobalScopeId(scope: SyntaxNode): number {
  return scope.id;
}

export function getIdentifierKey(node: SyntaxNode): string {
  return node.text.toLowerCase();
}

export function getSymbol(
  node: SyntaxNode,
  symbols: SymbolMap,
): LanguageSymbol | null {
  if (!isReference(node)) {
    return null;
  }
  const identifierKey = getIdentifierKey(node);
  let scopeNode = getContainingScope(node);

  let symbol: LanguageSymbol | null = null;
  while (scopeNode) {
    const scopeId = getScopeId(scopeNode);
    const scope =
      scopeId === "global" ? symbols.global : symbols.scopes[scopeId];
    if (scope && identifierKey in scope) {
      if (!symbol || scope[identifierKey].declaration) {
        symbol = scope[identifierKey];
      }
      if (symbol.declaration) {
        return symbol;
      }
    }
    scopeNode = getContainingScope(scopeNode);
  }

  return null;
}

export function getNodeBefore(node: SyntaxNode): SyntaxNode | null {
  let currentNode = node;

  while (currentNode.parent) {
    if (currentNode.parent.startIndex < node.startIndex) {
      return (
        currentNode.previousSibling?.descendantForIndex(
          currentNode.parent.endIndex,
        ) ?? null
      );
    }
    currentNode = currentNode.parent;
  }

  return null;
}

export function findCapture(
  captures: QueryCapture[],
  name: string,
): QueryCapture | null {
  return captures.find((capture) => capture.name === name) ?? null;
}

export function* traverse(node: SyntaxNode) {
  const cursor = node.walk();

  yield cursor.currentNode;

  if (!cursor.gotoFirstChild()) {
    return;
  }

  yield cursor.currentNode;

  while (1) {
    if (cursor.gotoFirstChild() || cursor.gotoNextSibling()) {
      yield cursor.currentNode;
      continue;
    }

    do {
      if (!cursor.gotoParent() || cursor.currentNode.id === node.id) {
        return;
      }
    } while (!cursor.gotoNextSibling());
  }

  return;
}
