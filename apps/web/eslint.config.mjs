import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import jsxA11yPlugin from "eslint-plugin-jsx-a11y"
import importXPlugin from "eslint-plugin-import-x"
import reactHooksPlugin from "eslint-plugin-react-hooks"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ["**/.next/**", "scripts/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "jsx-a11y": jsxA11yPlugin,
      "import-x": importXPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@radix-ui/*"],
              message:
                "Do not import Radix directly in app code. Use app shims (e.g., '@/components/ui/dialog', '@/components/ui/popover', '@/components/ui/tooltip') or @repo/ui exports instead.",
            },
          ],
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./modules/shared/**",
              from: "./modules/ui/**",
              message: "modules/shared must not import from modules/ui",
            },
            {
              target: "./modules/*/**",
              from: "./modules/*/**",
              except: [
                "./shared/**",
                "../shared/**",
                "../../shared/**",
                "./ui/**",
                "../ui/**",
                "../../ui/**",
              ],
              message:
                "Domain modules must not import other domain modules. Only import from modules/shared or modules/ui.",
            },
          ],
        },
      ],
      // Warn when using the asChild prop directly in app code; this often causes Children.only issues.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXAttribute[name.name='asChild']",
          message:
            "Avoid using 'asChild' in app code. Prefer our shims (e.g., Button shim) or ensure exactly one non-Fragment child.",
        },
      ],
    },
  },
  {
    files: ["modules/ui/components/**/*.{ts,tsx}"],
    rules: {
      // UI shims are allowed to import Radix directly
      "no-restricted-imports": "off",
    },
  },
]

export default eslintConfig
