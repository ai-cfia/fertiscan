import { defineConfig } from "i18next-cli"

export default defineConfig({
  // Supported locales
  locales: ["en", "fr"],

  // Translation key extraction configuration
  extract: {
    // Source files to scan for translation keys
    input: [
      "src/**/*.{ts,tsx}",
      "!src/**/*.test.{ts,tsx}",
      "!src/**/*.spec.{ts,tsx}",
    ],
    // Output directory structure: src/locales/{locale}/{namespace}.json
    output: "src/locales/{{language}}/{{namespace}}.json",
    // Default namespace when none is specified
    defaultNS: "common",
    // Primary language (used as base for extraction)
    primaryLanguage: "en",
    // Key separator (dot notation)
    keySeparator: ".",
    // Namespace separator
    nsSeparator: ":",
    // Context separator (for context-based translations)
    contextSeparator: "_",
    // Plural separator
    pluralSeparator: "_",
    // Whether to sort keys alphabetically
    sort: true,
    // Whether to remove unused keys
    removeUnusedKeys: true,
    // Number of spaces for JSON indentation
    indentation: 2,
  },

  // TypeScript type generation configuration
  types: {
    // Input translation files to generate types from
    input: ["src/locales/en/**/*.json"],
    // Output path for generated TypeScript definitions
    output: "src/i18n.d.ts",
  },
})
