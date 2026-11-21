import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  // Custom rules
  {
    rules: {
      // Ban browser dialogs
      "no-alert": "error",
      "no-restricted-globals": [
        "error",
        {
          name: "alert",
          message: "Use toast notifications instead of alert(). Import useAdminToast or useToast.",
        },
        {
          name: "confirm",
          message: "Use ConfirmDialog component instead of confirm().",
        },
        {
          name: "prompt",
          message: "Use a proper input dialog instead of prompt().",
        },
      ],
    },
  },
]);

export default eslintConfig;
