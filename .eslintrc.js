module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { "argsIgnorePattern": "^_" }],
    'no-console': 'off'
  },
  overrides: [
    {
      files: ['packages/domain/**/*.ts', 'packages/domain/**/*.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react',
                message: 'Domain layer cannot import React.'
              },
              {
                name: 'mongodb',
                message: 'Domain layer cannot import MongoDB.'
              },
              {
                name: 'mongoose',
                message: 'Domain layer cannot import Mongoose.'
              }
            ],
            patterns: [
              {
                group: ['@tauri-apps/*', '@capacitor/*'],
                message: 'Domain layer cannot import Tauri or Capacitor packages.'
              },
              {
                group: ['*/*/infrastructure/**/*', '**/infrastructure/**', '../../infrastructure/**', '../infrastructure/**'],
                message: 'Domain layer cannot import Infrastructure packages.'
              },
              {
                group: ['*/*/application/**/*', '**/application/**', '../../application/**', '../application/**'],
                message: 'Domain layer cannot import Application packages.'
              },
              {
                group: ['*/*/apps/**/*', '**/apps/**', '../../apps/**', '../apps/**'],
                message: 'Domain layer cannot import from apps.'
              }
            ]
          }
        ]
      }
    },
    {
      files: ['packages/application/**/*.ts', 'packages/application/**/*.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react',
                message: 'Application layer cannot import React.'
              },
              {
                name: 'mongodb',
                message: 'Application layer cannot import MongoDB.'
              },
              {
                name: 'mongoose',
                message: 'Application layer cannot import Mongoose.'
              }
            ],
            patterns: [
              {
                group: ['@tauri-apps/*', '@capacitor/*'],
                message: 'Application layer cannot import Tauri or Capacitor packages.'
              },
              {
                group: ['*/*/infrastructure/**/*', '**/infrastructure/**', '../../infrastructure/**', '../infrastructure/**'],
                message: 'Application layer cannot import Infrastructure packages.'
              },
              {
                group: ['*/*/apps/**/*', '**/apps/**', '../../apps/**', '../apps/**'],
                message: 'Application layer cannot import from apps.'
              }
            ]
          }
        ]
      }
    }
  ]
};
