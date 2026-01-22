import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "shared", pattern: "src/shared/**" },
        { type: "entities", pattern: "src/entities/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "widgets", pattern: "src/widgets/**" },
        { type: "app", pattern: "src/app/**" },
      ],
    },
    rules: {
      eqeqeq: "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "shared", allow: ["shared"] },
            { from: "entities", allow: ["shared", "entities"] },
            { from: "features", allow: ["shared", "entities", "features"] },
            { from: "widgets", allow: ["shared", "entities", "features", "widgets"] },
            { from: "app", allow: ["shared", "entities", "features", "widgets", "app"] },
          ],
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/shared/**/**/**",
                "@/entities/**/**/**",
                "@/features/**/**/**",
                "@/widgets/**/**/**",
              ],
              message:
                "FSD 규칙: 레이어 내부 직접 경로 대신 public index.ts를 통해 import 해야 합니다.",
            },
          ],
        },
      ],
      "prefer-const": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  prettier,
]);

export default eslintConfig;
