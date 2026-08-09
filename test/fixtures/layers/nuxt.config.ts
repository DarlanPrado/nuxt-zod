import MyModule from '../../../src/module'

export default defineNuxtConfig({
  // Explicit `extends` (same discovery path as an auto-scanned `layers/` entry):
  // schemas under `./base/shared/schemas` are merged with this app's `shared/schemas`.
  extends: ['./base'],
  modules: [
    MyModule,
  ],
  nuxtZod: {
    zodVersion: 'v4',
  },
})
