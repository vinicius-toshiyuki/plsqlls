import { fmtNode } from "@providers/formatting/node";
import { buildParts } from "@providers/formatting/util/index";
import { loadTestData, options, parser, TestDataMap } from "../util";

export function forStatementTests() {
  let files: TestDataMap;
  beforeAll(async () => (files = await loadTestData(__dirname)));

  describe.each([["range"], ["select"]])("for statement", (testCase) => {
    test(testCase, () => {
      const data = files.get(testCase);

      if (!data) {
        throw new Error("Invalid data");
      }

      expect(data).toBeDefined();

      const tree = parser.parse(data.actual);
      const text = buildParts(fmtNode(tree.rootNode, options), options);
      expect(text).toBe(data.expected);
    });
  });
}
