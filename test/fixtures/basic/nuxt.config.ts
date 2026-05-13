import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  nuxtZod: {
    zodVersion: 'v4',
    validation: {
      statusCode: 409,
      message: 'Global validation failed',
      includeIssues: true,
    },
  },
})
