// Vitest-only runtime adapter. Production resolves #imports through Nuxt.
export const testRuntimeConfig = { public: { siteUrl: 'http://127.0.0.1' }, playerColorWritesEnabled: true };
export function useRuntimeConfig() { return testRuntimeConfig; }
