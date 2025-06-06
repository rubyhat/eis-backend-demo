import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-plugin-prettier";
import security from "eslint-plugin-security";

export default [
  // Use ESLint's recommended rules
  js.configs.recommended,

  // Configure Prettier
  {
    plugins: {
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },

  // Security plugin configuration
  {
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
      "security/detect-object-injection": "off", // This one can be too strict for MongoDB queries
      "security/detect-non-literal-fs-filename": "warn", // Warning instead of error for file operations
    },
  },

  // Global project configuration
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },

    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",

      // Additional rules specific to Node.js
      "no-process-exit": "error",
      "no-path-concat": "error",
      "no-buffer-constructor": "error",

      // Security best practices
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },

  // Specific overrides for test files
  {
    files: ["**/*.test.js", "**/*.spec.js", "**/__tests__/**"],
    rules: {
      "no-unused-expressions": "off",
      "no-undef": "off",
    },
  },
];
