import { readdirSync } from "node:fs";
import path from "node:path";

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

// Files whose names and default exports React Router's framework mode requires.
const FRAMEWORK_FILES = [
  "src/root.tsx",
  "src/routes.ts",
  "src/entry.client.tsx",
  "src/entry.server.tsx",
  "src/framework/*.tsx",
] as const;

const SCREEN_NAMES = readdirSync(path.join(import.meta.dirname, "src/ui/screens"), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

// Dependencies point inward: ui/app → screens → shared → primitives, and storage never sees ui.
const layerZones = [
  {
    target: "./src/storage",
    from: "./src/ui",
    message: "src/storage must not import from src/ui.",
  },
  {
    target: "./src/ui/primitives",
    from: ["./src/ui/shared", "./src/ui/screens", "./src/ui/app"],
    message: "Primitives are shadcn components only; they don't import our code.",
  },
  {
    target: "./src/ui/shared",
    from: ["./src/ui/screens", "./src/ui/app"],
    message: "Shared pieces don't import screens or the app shell.",
  },
  {
    target: "./src/ui/screens",
    from: "./src/ui/app",
    except: ["./AppData.tsx"],
    message: "Screens take only useAppData from src/ui/app.",
  },
];

// The rule of two: a piece a second screen needs moves to src/ui/shared.
const screenZones = SCREEN_NAMES.map((screenName) => ({
  target: `./src/ui/screens/${screenName}`,
  from: "./src/ui/screens",
  except: [`./${screenName}`],
  message: "Screens don't import each other. Move the piece to @/ui/shared/.",
}));

export default defineConfig(
  globalIgnores([
    "dist",
    "dist-sync",
    "build",
    "build-sync",
    ".react-router",
    ".wrangler",
    "coverage",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.flatConfigs.recommended,
    ],
    plugins: { "import-x": importX, unicorn },
    settings: {
      "import-x/resolver-next": [
        // Resolves the @/ alias, so import-x/no-restricted-paths sees the real file.
        importX.createNodeResolver({
          tsconfig: { configFile: path.join(import.meta.dirname, "tsconfig.app.json") },
          extensions: [".ts", ".tsx", ".js", ".json"],
        }),
      ],
    },
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
    // React Router's convention files and route adapters are the only default exports in src.
    files: [...FRAMEWORK_FILES],
    rules: { "import-x/no-default-export": "off" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import-x/no-restricted-paths": ["error", { zones: [...layerZones, ...screenZones] }],
    },
  },
  {
    files: ["src/**/*.tsx"],
    // A hook's tests take the hook's name; they're .tsx only to run in the jsdom project.
    ignores: [...FRAMEWORK_FILES, "src/ui/primitives/**", "src/**/__tests__/use*.test.tsx"],
    rules: { "unicorn/filename-case": ["error", { case: "pascalCase", checkDirectories: false }] },
  },
  {
    files: ["src/**/*.ts"],
    ignores: [...FRAMEWORK_FILES, "src/ui/primitives/**"],
    rules: { "unicorn/filename-case": ["error", { case: "camelCase", checkDirectories: false }] },
  },
  {
    // shadcn's own file names, so `shadcn add` works unchanged.
    files: ["src/ui/primitives/**"],
    rules: { "unicorn/filename-case": ["error", { case: "kebabCase", checkDirectories: false }] },
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
