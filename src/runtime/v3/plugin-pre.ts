import type { z as zType } from 'zod/v3'
import { defineNuxtPlugin } from '#app'
import { createAppZodAccessProxy, initAppZodRuntime } from '../app-zod-runtime'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  async setup(nuxtApp) {
    const { z } = await import('zod/v3')
    initAppZodRuntime(nuxtApp, z)
    return {
      provide: {
        zod: createAppZodAccessProxy<typeof zType>(nuxtApp),
      },
    }
  },
})
