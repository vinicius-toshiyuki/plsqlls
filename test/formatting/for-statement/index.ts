import { loadTestData, TestDataMap, testFormatting } from "../../util";

export function forStatementTests() {
  const files: TestDataMap = new Map();
  beforeAll(() => loadTestData(__dirname, files));

  describe.each([["range"], ["select"]])(
    "for statement",
    testFormatting(files),
  );
}
