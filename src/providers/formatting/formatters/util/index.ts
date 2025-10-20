import { FormatOptions, FormatPart } from "@types";
import { SyntaxNode } from "tree-sitter";
import { fmtNode } from "../node";

export function buildParts(
  parts: FormatPart[],
  options: FormatOptions,
): string {
  let indent = 0;
  let wasNewLine = false;
  let lineIndex = 0;
  const matchGroups: Map<string, Map<string, number>> = new Map();
  const lines = [{ text: "", indent: 0 }];

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

  const text = parts
    .map((part) => {
      if (part.widthMatching) {
        const width =
          matchGroups
            .get(part.widthMatching.namespace)
            ?.get(part.widthMatching.group) ?? 0;

        part.text = part.text.padEnd(width);
      }

      let text = "";
      if (wasNewLine) {
        indent += part.indent ?? 0;
        text += options.indentText.repeat(indent);
        lines[lineIndex].indent = indent;
      }
      indent += part.indentAfter ?? 0;
      wasNewLine = !!part.newLine;

      text += part.text;

      if (part.newLine) {
        text += "\n";
      } else if (part.spaceAfter) {
        text += " ";
      }

      const processedPart: {
        text: string;
        lineIndex: number;
        ctx: FormatPart;
      } = {
        text,
        lineIndex,
        ctx: part,
      };

      lines[lineIndex].text += text;
      if (part.newLine) {
        lineIndex++;
        lines[lineIndex] = { text: "", indent };
      }

      return processedPart;
    })
    .map((part) => {
      if (
        part.ctx.break &&
        !part.ctx.newLine &&
        lines[part.lineIndex].text.length > options.maxLength
      ) {
        return (
          part.text.trimEnd() +
          "\n" +
          options.indentText.repeat(
            lines[part.lineIndex].indent +
              (typeof part.ctx.break === "object"
                ? (part.ctx.break.indentAfter ?? options.indentAmount)
                : options.indentAmount),
          )
        );
      }
      return part.text;
    })
    .join("");

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
