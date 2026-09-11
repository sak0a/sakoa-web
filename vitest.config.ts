import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '#imports': fileURLToPath(new URL('./tests/support/nuxt-imports.js', import.meta.url)) } },
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**', '.nuxt/**', '.output/**'],
  },
})
