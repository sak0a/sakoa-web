import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: [
    '.output/**',
    '.superpowers/**',
    'coverage/**',
    'node_modules/**',
  ],
  rules: {
    // Keep the modernization gate focused on correctness while legacy code is
    // incrementally brought onto one formatting convention.
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-console': 'off',
    'no-unused-vars': 'off',
    'nuxt/prefer-import-meta': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/attributes-order': 'off',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/v-on-event-hyphenation': 'off',
  },
})
