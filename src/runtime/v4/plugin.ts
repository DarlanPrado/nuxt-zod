import type { z as zType } from 'zod/v4'
import { defineNuxtPlugin } from '#app'
import type { ZodConfigInput } from '../zod-config'
import { applyZodConfigToNamespace, omitZodConfigMethod } from '../zod-config'

export default defineNuxtPlugin({
  name: 'nuxt-zod',
  enforce: 'post',
  order: 10_000,
  async setup(nuxtApp) {
    const { z } = await import('zod/v4')
    const config = nuxtApp.$zodConfig as ZodConfigInput | undefined
    applyZodConfigToNamespace(z, config)
    const publicZod = omitZodConfigMethod(z)
    return {
      provide: {
        zod: publicZod as typeof zType,
      },
    }
  },
})
