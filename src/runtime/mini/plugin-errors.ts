import { defineNuxtPlugin, useAppConfig } from '#app'
import type { ZodErrorMessages } from './zod-errors'
import { applyGlobalZodErrorMessages } from './zod-errors'

export default defineNuxtPlugin({
  name: 'nuxt-zod-errors',
  enforce: 'pre',
  setup() {
    const appConfig = useAppConfig() as { zod?: { errors?: ZodErrorMessages } }
    applyGlobalZodErrorMessages(appConfig.zod?.errors)
  },
})
