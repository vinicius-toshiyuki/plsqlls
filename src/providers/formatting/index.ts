import {
  DocumentFormattingParams,
  DocumentRangeFormattingParams,
  FormattingOptions,
  Range,
  TextEdit,
} from "vscode-languageserver";
import {
  getIdentationLevel,
  GRAMMAR,
  isRangeContained,
  isSyntaxNode,
  KEYWORD_NODE_TYPES,
  OPERATOR_NODE_TYPES,
  toDocumentPosition,
  toDocumentRange,
  walkBreadth,
} from "@util";
import { Query, QueryCapture, SyntaxNode, Tree } from "tree-sitter";
import { FormatOptions, ServerContext } from "@types";
import PlSql from "@treesitter-parser/binding";
import { fmtNode as formatNode } from "./formatters/node";
import { buildParts } from "./formatters/util";

const TEXT_WRAP_LENGTH = 120;

const DEFAULT_OPTIONS: FormattingOptions = {
  insertSpaces: true,
  tabSize: 4,
};

const UPPER_CASE_TYPES = [
  GRAMMAR.RULE.BUILTIN_PROGRAM,
  GRAMMAR.RULE.BUILTIN_TYPE,
  GRAMMAR.RULE.CONSTANT,
  GRAMMAR.RULE.BOOLEAN,
  GRAMMAR.RULE.DUAL_BUILTIN,
  ...OPERATOR_NODE_TYPES,
  ...KEYWORD_NODE_TYPES,
];

function fmtNode(node: SyntaxNode): string {
  let newText: string;
  if (UPPER_CASE_TYPES.includes(node.type)) {
    newText = node.text.toUpperCase();
  } else if (node.type === GRAMMAR.RULE.UDT) {
    newText = node.text.toLowerCase();
  } else if (node.type === GRAMMAR.RULE.TYPE) {
    const typeQuery = new Query(PlSql, `[(builtin_type) (udt)] @type`);
    const [capture] = typeQuery.captures(node);
    if (capture.node.type === GRAMMAR.RULE.BUILTIN_TYPE) {
      newText = capture.node.text.toUpperCase();
    } else {
      newText = capture.node.text.toLowerCase();
    }
  } else if (node.type === GRAMMAR.RULE.IDENTIFIER) {
    if (node.previousSibling?.type === GRAMMAR.RULE.COLON_PUNCTUATION) {
      newText = node.text.toUpperCase();
    } else if (node.text.startsWith('"') && node.text.endsWith('"')) {
      newText = node.text;
    } else {
      newText = node.text.toLowerCase();
    }
  } else {
    newText = node.text;
  }

  return newText;
}

export function fmt(
  options: FormattingOptions,
): (strings: TemplateStringsArray, ...expressions: any[]) => string;
export function fmt(
  strings: TemplateStringsArray,
  ...expressions: any[]
): string;

export function fmt(
  this:
    | {}
    | {
        options: FormattingOptions;
      },
): string | ((strings: TemplateStringsArray, ...expressions: any[]) => string) {
  if (arguments.length === 1 && !Array.isArray(arguments[0])) {
    const options: FormattingOptions = arguments[0];
    return fmt.bind({ options });
  }

  const options: FormattingOptions =
    typeof this === "object" && "options" in this
      ? this.options
      : DEFAULT_OPTIONS;

  const [strings, ...expressions] = [...arguments] as unknown as [
    TemplateStringsArray,
    ...any,
  ];

  let text = strings.raw[0]
    .split(/\r?\n/)
    .map((s) => s.trimStart())
    .join("")
    .split(/\\n/)
    .join("\n");

  strings.raw.slice(1).forEach((str, i) => {
    const expression = expressions[i];

    let expressionText: string;
    if (typeof expression === "number") {
      expressionText = options.insertSpaces
        ? "".padStart(expression * options.tabSize)
        : "".padStart(expression, "\t");
    } else if (isSyntaxNode(expression)) {
      expressionText = fmtNode(expression);
    } else if (
      typeof expression === "object" &&
      "node" in expression &&
      "name" in expression &&
      isSyntaxNode(expression.node)
    ) {
      expressionText = fmtNode(expression.node);
    } else {
      expressionText = String(expression);
    }

    text +=
      expressionText +
      str
        .split(/\r?\n/)
        .map((s, index) =>
          index === 0 && expressionText.at(-1) !== "\n" ? s : s.trimStart(),
        )
        .join("")
        .split(/\\n/)
        .join("\n");
  });

  return text;
}

function formatFunctionDefinitionHeaders(
  root: SyntaxNode,
  options: FormattingOptions,
  range: Range | undefined,
): TextEdit[] {
  const edits = [];
  const functionDefinitionQuery = new Query(
    PlSql,
    `(function_definition
      (function_keyword) @function
      program_name: (identifier) @name
      (parenthesis_bracket__open) @open_params
      (param_declaration_list)? @params
      (parenthesis_bracket__close) @close_params
      (return_keyword) @return
      return_type: (type) @type
      (is_keyword) @is) @root`,
  );

  for (const match of functionDefinitionQuery.matches(root)) {
    const {
      root: headerCapture,
      function: functionCapture,
      name: nameCapture,
      open_params: openCapture,
      params: paramsCapture,
      close_params: closeCapture,
      return: returnCapture,
      type: typeCapture,
      is: isCapture,
    } = {
      params: null,
      ...Object.fromEntries(
        match.captures.map((capture) => [capture.name, capture]),
      ),
    } as {
      root: QueryCapture;
      function: QueryCapture;
      name: QueryCapture;
      open_params: QueryCapture;
      params: QueryCapture | null;
      close_params: QueryCapture;
      return: QueryCapture;
      type: QueryCapture;
      is: QueryCapture;
    };

    const firstNode = functionCapture.node;
    const lastNode = isCapture.node;

    if (
      range &&
      !isRangeContained(toDocumentRange(firstNode, lastNode), range)
    ) {
      continue;
    }

    const identation = getIdentationLevel(headerCapture.node);
    const nextIdentation = identation + 1;

    const isSharingLine =
      headerCapture.node.previousSibling?.endPosition.row ===
      headerCapture.node.startPosition.row;

    let inlineText = fmt(options)`
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${functionCapture.node} ${nameCapture.node}
      ${openCapture.node}
    `;
    let text = fmt(options)`
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${functionCapture.node} ${nameCapture.node}
      ${openCapture.node}\n
    `;

    if (paramsCapture) {
      const paramQuery = new Query(
        PlSql,
        `(param_declaration
           declaration_identifier: (identifier) @name
           [
             (in_keyword__param)
             (out_keyword__param)
           ]? @inOut
           (type) @type)`,
      );

      const parts = paramQuery
        .matches(paramsCapture.node)
        .map(({ captures }) => {
          if (captures.length === 2) {
            const [$name, $type] = captures;
            return [$name, $type] as const;
          }
          const [$name, $inOut, $type] = captures;
          return [$name, $type, $inOut] as const;
        });

      const maxLength = Math.max(
        ...parts.map(([$name]) => $name.node.text.length),
      );

      const inOutPaddingLength = Math.max(
        ...parts.map(([, , $inOut]) => $inOut?.node.text.length ?? -1),
      );
      const hasInOut = inOutPaddingLength >= 0;

      const texts = parts.map(([$name, $type, $inOut], index) => {
        const padding = "".padEnd(maxLength - $name.node.text.length);
        const inOut = $inOut ?? "IN";
        const inOutPadding = "".padStart(
          hasInOut
            ? inOutPaddingLength -
                (typeof inOut === "string"
                  ? inOut.length
                  : inOut.node.text.length)
            : 0,
        );

        const inlineText = fmt(options)`
          ${index === 0 ? "" : ", "}
          ${$name.node}${hasInOut ? fmt`${" "}${inOut}${inOutPadding}` : ""} ${$type.node}
        `;
        const text = fmt(options)`
          ${index === 0 ? "" : ",\n"}
          ${nextIdentation}
          ${$name.node}${padding}${hasInOut ? fmt`${" "}${inOut}${inOutPadding}` : ""} ${$type.node}
        `;

        return [inlineText, text];
      });

      inlineText += texts.map(([text]) => text).join("");
      text += texts.map(([_, text]) => text).join("");
    }

    inlineText += fmt(options)`
      ${closeCapture.node} ${returnCapture.node} ${typeCapture.node}\n
      ${identation}${isCapture.node}
    `;
    text += fmt(options)`
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
            ? headerCapture.node.previousSibling!.endPosition.column
            : 0,
        },
        end: toDocumentPosition(lastNode.endPosition),
      },
      newText: inlineText.length > TEXT_WRAP_LENGTH ? text : inlineText,
    });
  }

  return edits;
}

function formatBlockDeclarations(
  root: SyntaxNode,
  options: FormattingOptions,
  range: Range | undefined,
): TextEdit[] {
  const edits: TextEdit[] = [];

  const blockQuery = new Query(
    PlSql,
    `(block_statement
      (declare_keyword)
      (block_declaration
       declaration_identifier: (identifier) @name)* @declaration) @block`,
  );
  const declarationQuery = new Query(
    PlSql,
    `(block_declaration
      declaration_identifier: (identifier) @name
      (constant_keyword)? @constant
      (type) @type
      (assign_operator)? @operator
      .
      (expression)? @expression
      (semicolon_punctuation) @semicolon) @root`,
  );

  const blockMatches = blockQuery.matches(root);
  for (const match of blockMatches) {
    const blockCapture = match.captures.find(
      (capture) => capture.name === "block",
    );
    if (!blockCapture) {
      continue;
    }

    const matches = declarationQuery.matches(blockCapture.node);

    const maxLength = Math.max(
      ...matches
        .flatMap((match) => match.captures)
        .filter((capture) => capture.name === "name")
        .map((capture) => capture.node.text.length),
    );

    for (const match of matches) {
      const {
        $root,
        $name,
        $constant,
        $type,
        $operator,
        $expression,
        $semicolon,
      } = {
        $constant: null,
        $operator: null,
        $expression: null,
        ...Object.fromEntries(
          match.captures.map((capture) => ["$" + capture.name, capture]),
        ),
      } as {
        $root: QueryCapture;
        $name: QueryCapture;
        $constant: QueryCapture | null;
        $type: QueryCapture;
        $operator: QueryCapture | null;
        $expression: QueryCapture | null;
        $semicolon: QueryCapture;
      };

      const firstNode = $name.node;
      const lastNode = $semicolon.node;

      if (
        range &&
        !isRangeContained(toDocumentRange(firstNode, lastNode), range)
      ) {
        continue;
      }

      const identation = getIdentationLevel($name.node);
      const nextIdentation = identation + 1;

      const isSharingLine =
        $root.node.previousSibling?.endPosition.row ===
        $root.node.startPosition.row;

      const padding = "".padStart(maxLength - $name.node.text.length);

      const inlineText = fmt(options)`
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${$name}${padding}${$constant ? fmt` ${$constant}` : ""} ${$type}
      ${$operator ? " " + fmt`${$operator} ${$expression}` : ""}
      ${$semicolon}
    `;
      const text = fmt(options)`
      ${isSharingLine ? "\n" : ""}
      ${identation}
      ${$name}${padding}${$constant ? fmt` ${$constant}` : ""} ${$type}\n
      ${nextIdentation}
      ${$operator ? " " + fmt`${$operator} ${$expression}` : ""}
      ${$semicolon}
    `;

      edits.push({
        range: {
          start: {
            line: firstNode.startPosition.row,
            character: isSharingLine
              ? $root.node.previousSibling!.endPosition.column
              : 0,
          },
          end: toDocumentPosition(lastNode.endPosition),
        },
        newText: inlineText.length > TEXT_WRAP_LENGTH ? text : inlineText,
      });
    }
  }

  return edits;
}

function formatUpperLowerCase(
  root: SyntaxNode,
  options: FormattingOptions,
  range?: Range,
): TextEdit[] {
  const edits: TextEdit[] = [];

  walkBreadth(root, (node) => {
    const nodeRange = toDocumentRange(node);
    if (range && !isRangeContained(range, nodeRange)) {
      return false;
    }

    const newText = fmt(options)`${node}`;
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

function formatFromGrammar(
  tree: Tree,
  options: FormattingOptions,
  range?: Range,
): TextEdit[] {
  const edits: TextEdit[] = [];

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

export function getOnDocumentRangeFormattingHandler(
  context: ServerContext,
): (params: DocumentRangeFormattingParams) => TextEdit[] | null | undefined {
  return (params) => {
    const tree = context.trees[params.textDocument.uri];

    if (!tree) {
      return [];
    }

    const edits = formatFromGrammar(tree, params.options, params.range);

    return edits;
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

    const options: FormatOptions = {
      maxLength: TEXT_WRAP_LENGTH,
      ...(params.options.insertSpaces
        ? {
            indentText: " ",
            indentAmount: params.options.tabSize,
          }
        : {
            indentText: "\t",
            indentAmount: 1,
          }),
    };

    const parts = formatNode(tree.rootNode, options);

    const newText = buildParts(parts, options);

    const edit: TextEdit = {
      range: toDocumentRange(tree.rootNode),
      newText,
    };
    const edits = [edit];

    return edits;
  };
}
