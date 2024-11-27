import globals from "globals";
import pluginJs from "@eslint/js";
import eslintPluginJest from "eslint-plugin-jest";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"],
    plugins: {
      jest: eslintPluginJest,
    },
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        it: true,
        beforeAll: true,
        beforeEach: true,
        expect: true,
      },
    },
    rules: {
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/valid-expect": "error",
    },
  },
];