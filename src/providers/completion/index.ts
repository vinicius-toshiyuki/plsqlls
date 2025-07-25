import { ServerContext } from "@types";
import { getDeepestNodeAtPosition, GRAMMAR, walkBreadth } from "@util";
import { LookaheadIterator, SyntaxNode } from "tree-sitter";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  CompletionParams,
} from "vscode-languageserver";
import PlSql from "@treesitter-parser/binding";

function getIndetifierCompletions(node: SyntaxNode): CompletionItem[] {
  const items: { [key: string]: CompletionItem } = {};

  walkBreadth(node, (currentNode) => {
    if (currentNode.type === "identifier") {
      let kind: CompletionItemKind = CompletionItemKind.Property;

      // TODO: item kind should be decidable using only the current node info
      if (currentNode.closest(GRAMMAR.RULE.PARAM_DECLARATION)) {
        kind = CompletionItemKind.Variable;
      } else if (currentNode.closest("block_declaration")) {
        if (currentNode.nextSibling?.type === "constant_keyword") {
          kind = CompletionItemKind.Constant;
        } else {
          kind = CompletionItemKind.Variable;
        }
      } else if (currentNode.closest(GRAMMAR.RULE.FUNCTION_DEFINITION)) {
        kind = CompletionItemKind.Function;
      }

      items[currentNode.text] = {
        label: currentNode.text,
        kind: items[currentNode.text]?.kind ?? kind,
      };
    }
    return false;
  });

  return Object.values(items);
}

function getKeywordCompletions(node: SyntaxNode): CompletionItem[] {
  const it = new LookaheadIterator(PlSql, node.parseState);
  return [...it]
    .filter((type) => type.match(/_keyword$/))
    .map((type) => ({
      label: type.replace(/_keyword/, "").toUpperCase(),
      kind: CompletionItemKind.Keyword,
    }));
}

export function getOnCompletionHandler(
    context: ServerContext
): (
  params: CompletionParams,
) => CompletionItem[] | CompletionList | undefined | null {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return [];
    }

    const identifierItems = getIndetifierCompletions(tree.rootNode);

    const currentNode = getDeepestNodeAtPosition(
      tree.rootNode,
      params.position,
    );
    const keywordItems = getKeywordCompletions(currentNode);

    return {
      isIncomplete: true,
      items: [...identifierItems, ...keywordItems],
    };
  };
}
