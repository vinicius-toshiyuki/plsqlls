import { loadTestData, TestDataMap } from "../../util";
import { testFormatting } from "../../util";

export function selectExpressionTests() {
  const files: TestDataMap = new Map();
  beforeAll(() => loadTestData(__dirname, files));

  describe.each([
    ["basic"],
    ["join"],
    ["multi column"],
    ["column break"],
    ["aliases"],
  ])("select expression", testFormatting(files));
}
