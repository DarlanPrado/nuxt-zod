import { defineNuxtPlugin } from '#app'
import { z } from 'zod'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  setup() {
    return {
      provide: {
        zod: z,
      },
    }
  },
})
