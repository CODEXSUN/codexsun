import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'temp/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: [
      'apps/ui/src/features/docs/registry/**/*.{ts,tsx}',
      'apps/ui/src/features/docs/data/**/*.{ts,tsx}',
      'apps/ui/src/components/ui/badge.tsx',
      'apps/ui/src/components/ui/button-group.tsx',
      'apps/ui/src/components/ui/chart.tsx',
      'apps/ui/src/components/ui/form.tsx',
    ],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
