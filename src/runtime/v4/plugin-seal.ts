import { defineNuxtPlugin } from '#app'
import { sealAppZodRuntime } from '../app-zod-runtime'

export default defineNuxtPlugin({
  name: 'nuxt-zod:seal',
  enforce: 'post',
  order: 10_000,
  setup(nuxtApp) {
    sealAppZodRuntime(nuxtApp)
  },
})
