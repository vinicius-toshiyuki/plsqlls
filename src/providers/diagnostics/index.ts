import {
  getIdentifierKey,
  getSymbol,
  GRAMMAR,
  isReference,
  toDocumentRange,
  walkBreadth,
} from "@util";
import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticTag,
  DocumentDiagnosticParams,
  DocumentDiagnosticReport,
  DocumentDiagnosticReportKind,
} from "vscode-languageserver";
import { ServerConfig, ServerContext } from "../../types";
import { Tree } from "tree-sitter";
import { getDeclaration } from "../declaration";
import { isExternalSymbol } from "../../util";

export enum DIAGNOSTIC_CODE {
  SYNTAX_ERROR,
  UNDEFINED_IDENTIFIER,
  UNUSED_REFERENCE,
}

function getSyntaxDiagnostics(tree: Tree): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  walkBreadth(tree.rootNode, (node) => {
    if (node.isError) {
      diagnostics.push({
        range: toDocumentRange(node),
        message: "Syntax Error",
        code: DIAGNOSTIC_CODE.SYNTAX_ERROR,
      });
    }
    return false;
  });

  return diagnostics;
}

function getUndefinedDiagnostics(
  tree: Tree,
  context: ServerContext,
  config?: ServerConfig,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  walkBreadth(tree.rootNode, (node) => {
    if (
      isReference(node) &&
      node.previousSibling?.type !== GRAMMAR.RULE.COLON_PUNCTUATION &&
      getDeclaration(node, context) === null &&
      (!config || isExternalSymbol(config, node.text))
    ) {
      diagnostics.push({
        range: toDocumentRange(node),
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

function getUnusedDiagnostics(
  tree: Tree,
  context: ServerContext,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  walkBreadth(tree.rootNode, (node) => {
    const symbol = getSymbol(node, context.symbols);
    if (
      symbol &&
      node.previousSibling?.type !== GRAMMAR.RULE.COLON_PUNCTUATION &&
      (symbol.declaration ?? symbol.definition) !== null
    ) {
      const isUnused =
        symbol.references.filter(
          (ref) =>
            ref.node.id !== symbol.definition?.node.id &&
            ref.node.id !== symbol.declaration?.node.id,
        ).length === 0;

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
          range: toDocumentRange(symbol.definition.node),
          message: "Unused reference",
          code: DIAGNOSTIC_CODE.UNUSED_REFERENCE,
          severity: DiagnosticSeverity.Hint,
          tags: [DiagnosticTag.Unnecessary],
          data: {
            identifier: getIdentifierKey(symbol.definition.node),
          },
        });
      }
    }
    return false;
  });

  return diagnostics;
}

export function getOnDiagnosticsHandler(
  context: ServerContext,
): (param: DocumentDiagnosticParams) => DocumentDiagnosticReport {
  return (params) => {
    const uri = params.textDocument.uri;
    const tree = context.trees[uri];
    const config = context.configs[uri];
    if (!tree) {
      return {
        kind: DocumentDiagnosticReportKind.Full,
        items: [],
      } satisfies DocumentDiagnosticReport;
    }

    const diagnostics = [
      ...getSyntaxDiagnostics(tree),
      ...getUndefinedDiagnostics(tree, context, config),
      ...getUnusedDiagnostics(tree, context),
    ];

    return {
      kind: DocumentDiagnosticReportKind.Full,
      items: diagnostics,
    } satisfies DocumentDiagnosticReport;
  };
}
