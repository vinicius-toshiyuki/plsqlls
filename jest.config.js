import { pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.json" with { type: "json" };

export const preset = "ts-jest";
export const testEnvironment = "node";
export const moduleNameMapper = pathsToModuleNameMapper(
  tsconfig.compilerOptions.paths,
  {
    prefix: process.cwd(),
    useESM: true,
  },
);
export const testPathIgnorePatterns = ["dist"];
