// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
    'vue/html-self-closing': ['warn', {
      html: {
        void: 'any',
        normal: 'any',
        component: 'always',
      },
    }],
    'vue/no-v-html': 'warn',
  },
}).prepend({
  ignores: ['**/cypress', '**/dist', '**/node_modules', '**/tests'],
});
