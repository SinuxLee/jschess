// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/*/src/**/*.ts', 'tools/*/src/**/*.ts'],
    plugins: { import: importPlugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: true }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error'
    }
  },
  {
    files: ['packages/engine/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'engine must be DOM-free' },
        { name: 'window',   message: 'engine must be DOM-free' },
        { name: 'Image',    message: 'engine must be DOM-free' },
        { name: 'Audio',    message: 'engine must be DOM-free' }
      ]
    }
  },
  {
    files: ['packages/ai/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'ai must be DOM-free' },
        { name: 'window',   message: 'ai must be DOM-free' }
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['svelte', '@jschess/game', '@jschess/app'] }
      ]
    }
  },
  {
    files: ['packages/game/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'document', message: 'game must be DOM-free' },
        { name: 'window',   message: 'game must be DOM-free' },
        { name: 'Audio',    message: 'game must not reference Audio — emit events instead' }
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['svelte', '@jschess/app', '@preact/signals-core'] }
      ]
    }
  },
  {
    files: ['packages/app/src/**/*.{ts,svelte}'],
    plugins: { svelte: sveltePlugin },
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser }
    }
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'legacy/**', '**/*.test.ts']
  }
];
