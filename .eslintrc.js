module.exports = {
  parserOptions: {
      ecmaVersion: 9,
      sourceType: 'module',
  },
  extends: ['@tophat/eslint-config/base', '@tophat/eslint-config/jest'],
  rules: {
      'no-console': 'off',
  }
}
