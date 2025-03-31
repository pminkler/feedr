module.exports = {
  root: true,
  extends: ['plugin:cypress/recommended'],
  env: {
    'cypress/globals': true,
  },
  plugins: ['cypress'],
  rules: {
    'no-undef': 'off',
  },
};
