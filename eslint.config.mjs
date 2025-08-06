import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Completely disable unused variable checks
      "@typescript-eslint/no-empty-object-type": "off", // Allow empty interfaces
      "@typescript-eslint/no-explicit-any": "off", // Allow any type
      "prefer-const": "warn", // Warn instead of error for const suggestions
      "react/no-unescaped-entities": "off", // Allow unescaped entities in JSX
    },
  },
];

export default eslintConfig;
