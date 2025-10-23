import { FormatOptions, ServerContext } from "@types";
import { toDocumentRange } from "@util";
import {
  DocumentFormattingParams,
  DocumentRangeFormattingParams,
  FormattingOptions,
  MessageType,
  Range,
  TextEdit,
} from "vscode-languageserver";
import { fmtNode as formatNode } from "./formatters/node";
import { buildParts } from "./formatters/util";
import { SyntaxNode } from "tree-sitter";

const TEXT_WRAP_LENGTH = 120;

function getFormatOptions(lspOptions: FormattingOptions): FormatOptions {
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

function notifyError(this: ServerContext, e: unknown): void {
  this.sendMessage(
    MessageType.Error,
    e instanceof Error ? `[${e.name}] ${e.message}\n${e.stack}` : String(e),
  );
}

function format(
  node: SyntaxNode,
  options: FormatOptions,
  range: Range,
): TextEdit[] {
  const newText = buildParts(formatNode(node, options), options);
  return [{ newText, range }];
}

export function getOnDocumentRangeFormattingHandler(
  context: ServerContext,
): (params: DocumentRangeFormattingParams) => TextEdit[] | null | undefined {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return [];
    }

    const options = getFormatOptions(params.options);

    try {
      return format(tree.rootNode, options, params.range);
    } catch (e) {
      notifyError.bind(context)(e);
    }
    return [];
  };
}

export function getOnDocumentFormattingHandler(
  context: ServerContext,
): (params: DocumentFormattingParams) => TextEdit[] | null | undefined {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return [];
    }

    const options = getFormatOptions(params.options);

    try {
      return format(tree.rootNode, options, toDocumentRange(tree.rootNode));
    } catch (e) {
      notifyError.bind(context)(e);
    }
    return [];
  };
}
