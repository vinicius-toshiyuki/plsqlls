import { FormatOptions, FormatPart, FormatPartContext } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "../node";
import { Range } from "vscode-languageserver";
import { isRangeContained } from "@util";

export function buildParts(
  parts: FormatPart[],
  options: FormatOptions,
  range?: Range,
): string {
  let indent = 0;
  let wasNewLine = false;
  let lineIndex = 0;
  const matchGroups: Map<string, Map<string, number>> = new Map();
  const lines = [{ text: "", indent: 0, forceBreak: false }];

  parts.forEach((part) => {
    if (part.widthMatching) {
      if (!matchGroups.has(part.widthMatching.namespace)) {
        matchGroups.set(part.widthMatching.namespace, new Map());
      }

      const namespace = matchGroups.get(part.widthMatching.namespace)!;

      if (!namespace.has(part.widthMatching.group)) {
        namespace.set(part.widthMatching.group, part.text.length);
      } else {
        const width = namespace.get(part.widthMatching.group)!;
        namespace.set(
          part.widthMatching.group,
          Math.max(width, part.text.length),
        );
      }
    }
  });

  const processedParts = parts.map((part, index, parts) => {
    if (part.widthMatching) {
      const width =
        matchGroups
          .get(part.widthMatching.namespace)
          ?.get(part.widthMatching.group) ?? 0;

      part.text = part.text.padEnd(width);
    }

    let text = "";

    if (part.newLineBefore) {
      wasNewLine = true;
      text += "\n";
      lineIndex++;
      lines[lineIndex] = {
        text: "",
        indent,
        forceBreak: false,
      };
    }

    if (wasNewLine) {
      indent += part.indent ?? 0;
      text += options.indentText.repeat(Math.max(0, indent));
      lines[lineIndex].indent = Math.max(0, indent);
    }
    indent += part.indentAfter ?? 0;
    wasNewLine = !!part.newLine;

    text += part.text;

    if (part.newLine) {
      text += "\n";
    } else if (
      part.spaceAfter &&
      (index + 1 >= parts.length - 1 || !parts[index + 1].spaceBeforeCollapse)
    ) {
      text += " ";
    }

    if (part.forceLineBreak) {
      lines[lineIndex].forceBreak = true;
    }

    const processedPart: {
      text: string;
      lineIndex: number;
      ctx: FormatPartContext;
    } = {
      text,
      lineIndex,
      ctx: part,
    };

    lines[lineIndex].text += text;
    if (part.newLine) {
      lineIndex++;
      lines[lineIndex] = { text: "", indent, forceBreak: false };
    }

    return processedPart;
  });

  let partLineIndex: number;
  let breakIndent: number;
  const text = processedParts
    .map((part, index) => {
      if (index === 0) {
        partLineIndex = part.lineIndex;
        breakIndent = 0;
      }

      if (range && !isRangeContained(part.ctx.range, range)) {
        partLineIndex = part.lineIndex;
        return "";
      }

      const prefix = "\n".repeat(part.ctx.skipLines ?? 0);

      if (
        part.ctx.break &&
        !part.ctx.newLine &&
        (lines[part.lineIndex].text.length > options.maxLength ||
          lines[part.lineIndex].forceBreak)
      ) {
        if (partLineIndex !== part.lineIndex) {
          breakIndent = 0;
        }
        let indentIncrement = 0;
        let padding = 0;

        if (typeof part.ctx.break === "object") {
          if (typeof part.ctx.break.indentAfter === "number") {
            indentIncrement = part.ctx.break.indentAfter;
          }
          if (typeof part.ctx.break.widthMatching === "object") {
            const { namespace, group } = part.ctx.break.widthMatching;
            padding = matchGroups.get(namespace)?.get(group) ?? 0;
            padding += part.ctx.break.spaceAfter ? 1 : 0;
          }
        }

        breakIndent += indentIncrement;
        partLineIndex = part.lineIndex;
        return (
          prefix +
          part.text.trimEnd() +
          "\n" +
          options.indentText.repeat(
            Math.max(0, lines[part.lineIndex].indent + breakIndent),
          ) +
          " ".repeat(padding)
        );
      }
      partLineIndex = part.lineIndex;
      return prefix + part.text;
    })
    .join("");

  if (range) {
    const lines = text.split("\n");

    const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);
    const lastLineIndex = lines.findLastIndex((line) => line.trim().length > 0);

    if (firstLineIndex >= 0 && lastLineIndex >= 0) {
      return lines.slice(firstLineIndex, lastLineIndex + 1).join("\n");
    }
  }

  return text;
}

export function spaceAfterPart(
  node: SyntaxNode,
  options: FormatOptions,
): FormatPart {
  const part = fmtNode(node, options);
  if (part.length !== 1) {
    throw new Error("Expected only a single part");
  }
  part[0].spaceAfter = true;
  return part[0];
}
