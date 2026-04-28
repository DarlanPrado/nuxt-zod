export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  nuxtZod: {
    validation: {
      statusCode: 422,
      message: 'Validation failed',
      includeIssues: true,
    },
  },
})
