import { DIAGNOSTIC_CODE } from "@providers/diagnostics";
import { ServerContext } from "@types";
import {
  getContainingScope,
  getDeepestNodeAtPosition,
  GRAMMAR,
  PROGRAM_DEFINITION_TYPES,
  SCOPE_NODE,
  toDocumentPosition,
} from "@util";
import { SyntaxNode } from "tree-sitter";
import {
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  Command,
  TextDocumentIdentifier,
} from "vscode-languageserver";

function getAddScopeDeclarationAction(
  node: SyntaxNode,
  identifierName: string,
  textDocument: TextDocumentIdentifier,
): CodeAction | null {
  const scope = getContainingScope(node);

  if (!scope) {
    return null;
  }

  let insertBeforeNode: SyntaxNode | undefined;
  let newText: string | undefined;

  if (PROGRAM_DEFINITION_TYPES.includes(scope.type)) {
    const beginNode = scope.children.find(
      (child) => child.type === GRAMMAR.RULE.BEGIN_KEYWORD,
    );
    insertBeforeNode = beginNode;
    newText = `${identifierName} VARCHAR2(4000);\n`;
  } else if (scope.type === SCOPE_NODE.BLOCK_STATEMENT) {
    const [beginNode] = scope.descendantsOfType(GRAMMAR.RULE.BEGIN_KEYWORD);
    insertBeforeNode = beginNode;

    if (!scope.children.some((child) => child.type === "declare_keyword")) {
      newText = `DECLARE\n${identifierName} VARCHAR2(4000);\n`;
    } else {
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
              start: toDocumentPosition(insertBeforeNode.startPosition),
              end: toDocumentPosition(insertBeforeNode.startPosition),
            },
            newText,
          },
        ],
      },
    },
  };
}

function getAddParameterDeclarationAction(
  node: SyntaxNode,
  identifierName: string,
  textDocument: TextDocumentIdentifier,
): CodeAction | null {
  let scope = getContainingScope(node);
  while (scope && !PROGRAM_DEFINITION_TYPES.includes(scope.type)) {
    scope = getContainingScope(scope);
  }

  if (!scope) {
    return null;
  }

  const insertBeforeNode = scope.children.find(
    (child) => child.type === GRAMMAR.RULE.PARENTHESIS_BRACKET__CLOSE,
  );
  const previousSibling = insertBeforeNode?.previousSibling;

  const hasOtherParameters =
    previousSibling?.type === GRAMMAR.RULE.PARAM_DECLARATION_LIST;
  const programName = scope.childForFieldName(GRAMMAR.FIELD.PROGRAM_NAME)?.text;
  const newText = `${hasOtherParameters ? ",\n" : ""}${identifierName} VARCHAR2(4000)\n`;

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
              start: toDocumentPosition(
                previousSibling?.endPosition ?? insertBeforeNode.startPosition,
              ),
              end: toDocumentPosition(insertBeforeNode.startPosition),
            },
            newText,
          },
        ],
      },
    },
  };
}

export function getOnCodeActionHandler(
  context: ServerContext,
): (param: CodeActionParams) => (CodeAction | Command)[] | undefined | null {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];
    if (!tree) {
      return null;
    }

    const actions: CodeAction[] = [];

    for (const diagnostic of params.context.diagnostics) {
      if (diagnostic.code === DIAGNOSTIC_CODE.UNDEFINED_IDENTIFIER) {
        const node = getDeepestNodeAtPosition(
          tree.rootNode,
          params.range.start,
        );
        if (!node) {
          continue;
        }

        const scopeDeclarationAction = getAddScopeDeclarationAction(
          node,
          diagnostic.data.identifier,
          params.textDocument,
        );
        if (scopeDeclarationAction) {
          actions.push({
            ...scopeDeclarationAction,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
          });
        }

        const parameterDeclarationAction = getAddParameterDeclarationAction(
          node,
          diagnostic.data.identifier,
          params.textDocument,
        );
        if (parameterDeclarationAction) {
          actions.push({
            ...parameterDeclarationAction,
            kind: CodeActionKind.QuickFix,
            diagnostics: [diagnostic],
          });
        }
      }
    }

    return actions;
  };
}
