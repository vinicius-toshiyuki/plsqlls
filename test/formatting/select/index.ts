import { fmtNode } from "@providers/formatting/node";
import { buildParts } from "@providers/formatting/util/index";
import { loadTestData, options, parser, TestDataMap } from "../util";

export function selectExpressionTests() {
  let files: TestDataMap;
  beforeAll(async () => (files = await loadTestData(__dirname)));

  describe.each([
    ["basic"],
    ["join"],
    ["multi column"],
    ["column break"],
    ["aliases"],
  ])("select expression", (testCase) => {
    test(testCase, () => {
      const data = files.get(testCase.replace(/\s/g, "-"));

      if (!data) {
        throw new Error("Invalid data");
      }

      expect(data).toBeDefined();

      const tree = parser.parse(data.actual);
      const text = buildParts(fmtNode(tree.rootNode, options), options);

      if (text !== data.expected) {
        console.log(
          JSON.stringify({
            actual: data.actual,
            formatted: text,
            expected: data.expected,
          }),
        );
      }
      expect(text).toBe(data.expected);
    });
  });
}
