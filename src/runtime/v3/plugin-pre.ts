import type { z as zType } from 'zod/v3'
import { defineNuxtPlugin } from '#app'
import { createAppZodAccessProxy, initAppZodRuntime } from '../app-zod-runtime'
import { z } from './zod-app'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'pre',
  setup(nuxtApp) {
    initAppZodRuntime(nuxtApp, z)
    return {
      provide: {
        zod: createAppZodAccessProxy<typeof zType>(nuxtApp),
      },
    }
  },
})
