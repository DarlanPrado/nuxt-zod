import type { z as zType } from 'zod/v3'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  async setup() {
    const { z } = await import('zod/v3')
    return {
      provide: {
        zod: z as typeof zType,
      },
    }
  },
})