import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly' },
    },
    rules: { 'no-unused-vars': 'off' },
  },
  {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // APIs de runtime disponibles en web y React Native. shared no accede a
        // window/document/localStorage/navigator, pero sí a estas primitivas.
        AbortController: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'navigator',
      ],
      'no-unused-vars': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react-router-dom',
            'react-router-dom/*',
            '*.css',
            'frontend/*',
            'mobile/*',
            '**/components/ui/*',
            '@/components/ui/*',
          ],
          paths: [
            {
              name: 'react-router-dom',
              message: 'shared/ no puede importar react-router-dom.',
            },
          ],
        },
      ],
    },
  },
]