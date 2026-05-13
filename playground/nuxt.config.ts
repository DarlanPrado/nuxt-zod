export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  nuxtZod: {
    zodVersion: 'v4',
    client: true,
    server: true,
    schemas: {
      enabled: true,
      dir: 'shared/schemas',
    },
    validation: {
      statusCode: 422,
      message: 'Validation failed',
      includeIssues: true,
    },
  },
})
