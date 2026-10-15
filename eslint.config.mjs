// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['.output/**', '.nuxt/**', 'node_modules/**'],
}).append({
  rules: {
    // Keep the rules light for now; tighten as the codebase grows.
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
})
