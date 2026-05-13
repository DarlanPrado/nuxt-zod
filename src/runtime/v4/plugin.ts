import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  async setup() {
    const { z } = await import('zod/v4')
    return {
      provide: {
        zod: z,
      },
    }
  },
})
