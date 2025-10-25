import { FormatPart } from "@types";
import assert from "assert";

export function assertAtLeastOnePart(
  parts: FormatPart[],
): parts is [FormatPart, ...FormatPart[]] {
  assert(parts.length !== 0, "Expected at least one part");
  return true;
}

export function assertOnePart(parts: FormatPart[]): parts is [FormatPart] {
  assert(parts.length === 1, "Expected only one part");
  return true;
}
