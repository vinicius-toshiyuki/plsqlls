import fs from "node:fs";
import path from "node:path";
import { createParser } from "@treesitter-parser/plsql";

export const parser: ReturnType<typeof createParser> = createParser();
export const options = {
  indentAmount: 4,
  indentText: " ",
  maxLength: 120,
} as const;

export type TestDataMap = Map<string, { expected: string; actual: string }>;

export async function loadTestData(dir: string) {
  const files: TestDataMap = new Map();
  const dataDir = path.join(dir, "data");
  const dirFiles = fs.readdirSync(dataDir);
  const promises: Promise<void>[] = [];
  for (const file of dirFiles) {
    const maybeName = path.basename(file, path.extname(file));
    const ext = path.extname(maybeName);
    const name = path.basename(maybeName, ext);

    if (!files.has(name)) {
      files.set(name, {
        expected: "",
        actual: "",
      });
    }

    promises.push(
      fs.promises.readFile(path.join(dataDir, file)).then((text) => {
        const data = files.get(name);
        if (!data) {
          throw new Error(`Object for <${name}> not set`);
        }
        if (ext === ".expected") {
          data.expected = text.toString();
        } else {
          data.actual = text.toString();
        }
      }),
    );
  }

  await Promise.all(promises);

  return files;
}
