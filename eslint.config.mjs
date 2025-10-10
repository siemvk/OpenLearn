import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // Global ignores first
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js',
      'coverage/**',
      '.env*',
      'public/**',
      'prisma/**',
    ],
  },

  // Base configuration
  js.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Disable overly strict rules
      'no-undef': 'off', // TypeScript handles this better
      'no-unused-vars': 'off', // Using TypeScript version instead

      // TypeScript rules (more lenient)
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'off', // Too strict for development
      '@typescript-eslint/prefer-const': 'off', // Let prefer-const handle this

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off', // Too noisy in development

      // General rules (lenient)
      'no-console': 'off', // Allow console.log in development
      'no-debugger': 'warn',
      'prefer-const': 'off', // Too strict
      'no-var': 'warn',
      'no-empty': 'off',
      'no-async-promise-executor': 'off',
      'no-duplicate-case': 'error',
      'no-case-declarations': 'off', // Common in switch statements
      'no-useless-escape': 'warn',
      'no-unreachable': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
