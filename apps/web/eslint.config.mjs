import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:jsx-a11y/recommended"),
  {
    files: ["**/*.{ts,tsx}"],
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
    },
  },
  {
    files: ["modules/ui/components/**/*.{ts,tsx}"],
    rules: {
      // UI shims are allowed to import Radix directly
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "modules/**/*.{ts,tsx}"],
    ignores: ["modules/ui/components/**/*"],
    rules: {
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
]

export default eslintConfig
