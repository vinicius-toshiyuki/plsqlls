import { SyntaxNode, Tree } from "tree-sitter";
import { createConnection, MessageType, Range } from "vscode-languageserver";

export type DocumentTrees = { [uri: string]: Tree };

export type ServerConfig = {
  version: string;
  options: {
    include?: string[];
    external?: (
      | string
      | {
          name: string;
          docs?: string;
        }
    )[];
  };
};

export type Reference = {
  uri: string;
  node: SyntaxNode;
};

export type LanguageSymbol = {
  uri: string;
  references: Reference[];
  declaration: Reference | null;
  definition: Reference | null;
  scopeNodeId: number;
};

export type Scope = {
  [identifier: string]: LanguageSymbol;
};

export type SymbolMap = {
  global: Scope;
  scopes: {
    [scopeNodeId: number]: Scope;
  };
};

export type ServerContext = {
  trees: DocumentTrees;
  configs: {
    [uri: string]: ServerConfig;
  };
  symbols: SymbolMap;
  sendMessage: (type: MessageType, message: string) => void;
  console: ReturnType<typeof createConnection>["console"];
};

export type FormatPartWidthMatching = {
  namespace: string;
  group: string;
};

export type FormatPart = {
  text: string;
  newLine?: boolean;
  newLineBefore?: boolean;
  indent?: number;
  indentAfter?: number;
  spaceAfter?: boolean;
  spaceBeforeCollapse?: boolean;
  break?:
    | boolean
    | {
        indentAfter?: number;
        widthMatching?: FormatPartWidthMatching;
        spaceAfter?: boolean;
      };
  skipLines?: number;
  widthMatching?: FormatPartWidthMatching;
  range: Range;
  forceLineBreak?: boolean;
};

export type FormatPartContext = Pick<
  FormatPart,
  "range" | "skipLines" | "break" | "newLine" | "indentAfter" | "indent"
>;

export type FormatOptions = {
  indentAmount: number;
  indentText: " " | "\t";
  maxLength: number;
};
