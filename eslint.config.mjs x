import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals"), // Extend Next.js rules
  {
    ignores: [".next/**/*"],

    files: ["**/*.js", "**/*.jsx"], // Apply only to JavaScript files
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true, // Support JSX in JavaScript
        },
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Disable rule for React 17+ (automatic JSX import)
      "react/no-find-dom-node": "off",
    },
  },
];
