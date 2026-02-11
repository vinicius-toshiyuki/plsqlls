import { pathsToModuleNameMapper, createDefaultPreset } from "ts-jest";
import tsconfig from "./tsconfig.json" with { type: "json" };

export default {
  // preset: "ts-jest",
  ...createDefaultPreset({
    diagnostics: {
      ignoreCodes: [151002],
    },
  }),
  testEnvironment: "node",
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: process.cwd(),
    useESM: true,
  }),
  testPathIgnorePatterns: ["dist"],
};
