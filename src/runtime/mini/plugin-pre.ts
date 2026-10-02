import type * as zType from 'zod/mini'
import { defineNuxtPlugin } from '#app'
import { createAppZodAccessProxy, initAppZodRuntime } from '../app-zod-runtime'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  async setup(nuxtApp) {
    const z = await import('zod/mini')
    initAppZodRuntime(nuxtApp, z)
    return {
      provide: {
        zod: createAppZodAccessProxy<typeof zType>(nuxtApp),
      },
    }
  },
})
