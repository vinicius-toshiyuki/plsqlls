import { SyntaxNode, Tree } from "tree-sitter";
import { createConnection, MessageType } from "vscode-languageserver";

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

export type FormatPart = {
  text: string;
  newLine?: boolean;
  indent?: number;
  indentAfter?: number;
  spaceAfter?: boolean;
  break?: boolean | { indentAfter?: number };
  skipLines?: number;
  widthMatching?: {
    namespace: string;
    group: string;
  };
};

export type FormatOptions = {
  indentAmount: number;
  indentText: " " | "\t";
  maxLength: number;
};
