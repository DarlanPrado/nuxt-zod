import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  nuxtZod: {
    zodVersion: 'v4',
    errors: {
      invalid_type: 'isolation-nitro-zod-errors',
    },
  },
})
