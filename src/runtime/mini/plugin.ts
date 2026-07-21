import type * as zType from 'zod/mini'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  async setup() {
    const z = await import('zod/mini')
    return {
      provide: {
        zod: z as typeof zType,
      },
    }
  },
})
