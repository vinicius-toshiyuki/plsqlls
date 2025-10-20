import { SyntaxNode, Tree } from "tree-sitter";
import {
  createConnection,
  MessageType,
  TextDocuments,
} from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";

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
  documents: TextDocuments<TextDocument>;
  configs: {
    [uri: string]: ServerConfig;
  };
  symbols: SymbolMap;
  sendMessage: (type: MessageType, message: string) => void;
  console: ReturnType<typeof createConnection>["console"];
};
