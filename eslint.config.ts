import eslint from "@eslint/js";
import type { Linter } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

const BOOLEAN_PREFIXES = ["is", "has", "should", "can", "IS_", "HAS_", "SHOULD_", "CAN_"];

// Rules that encode the AGENTS.md code style.
const codeStyleRules: Linter.RulesRecord = {
  "@typescript-eslint/no-explicit-any": "error",
  "no-nested-ternary": "error",
  "id-length": ["error", { min: 2, exceptions: ["i", "a", "b", "t", "T"], properties: "never" }],
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      "ts-expect-error": "allow-with-description",
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-check": true,
    },
  ],
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
  ],
  "no-console": ["error", { allow: ["error"] }],
  "@typescript-eslint/naming-convention": [
    "error",
    {
      selector: ["variable", "parameter"],
      types: ["boolean"],
      format: ["PascalCase", "UPPER_CASE"],
      prefix: BOOLEAN_PREFIXES,
    },
    // PascalCase is for values rendered as JSX: components and React contexts.
    {
      selector: "variable",
      modifiers: ["const", "global"],
      format: ["UPPER_CASE", "camelCase", "PascalCase"],
    },
    // Destructured names come from someone else's object (props, library results).
    { selector: ["variable", "parameter"], modifiers: ["destructured"], format: null },
    {
      selector: ["variable", "parameter"],
      modifiers: ["destructured"],
      types: ["boolean"],
      format: null,
    },
    { selector: "typeLike", format: ["PascalCase"] },
    {
      selector: "interface",
      format: ["PascalCase"],
      custom: { regex: "^I[A-Z]", match: false },
    },
  ],
  "import-x/no-default-export": "error",
  "unicorn/no-array-reduce": ["error", { allowSimpleOperations: true }],
  "unicorn/no-array-callback-reference": "off",
  "unicorn/no-array-sort": "error",
  "unicorn/no-array-reverse": "error",
  "unicorn/prevent-abbreviations": "off",
  "max-depth": ["warn", 2],
};

export default defineConfig(
  globalIgnores(["dist", "coverage"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: { "import-x": importX, unicorn },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: codeStyleRules,
  },
  {
    files: ["*.config.ts"],
    languageOptions: { globals: globals.node },
    rules: { "import-x/no-default-export": "off" },
  },
  {
    // Domain purity: src/domain is plain TypeScript, so it can move to a server.
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "src/domain must stay pure: no React." },
            { name: "react-dom", message: "src/domain must stay pure: no React." },
          ],
          patterns: [
            { group: ["react/*", "react-dom/*"], message: "src/domain must stay pure: no React." },
            {
              group: ["@/ui", "@/ui/*", "**/ui", "**/ui/*"],
              message: "src/domain must not import from src/ui.",
            },
            {
              group: ["@/storage", "@/storage/*", "**/storage", "**/storage/*"],
              message: "src/domain must not import from src/storage.",
            },
          ],
        },
      ],
    },
  },
);
