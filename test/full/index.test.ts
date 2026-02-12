import { loadTestData, TestDataMap, testFormatting } from "../util";

const files: TestDataMap = new Map();
beforeAll(() => loadTestData(__dirname, files));
describe.each([["function definition"]])("full", testFormatting(files));
