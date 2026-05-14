import nuxtZod from '../../../dist/module.mjs'

export default defineNuxtConfig({
  modules: [nuxtZod],
  nuxtZod: {
    zodVersion: 'v4',
    schemas: { enabled: false },
  },
})
