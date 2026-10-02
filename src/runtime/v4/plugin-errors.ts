import { defineNuxtPlugin, useAppConfig } from '#app'
import { registerAppZodEffectiveBaseline } from '../zod-context-config'
import type { ZodErrorMessages } from './zod-errors'
import { applyGlobalZodErrorMessages } from './zod-errors'
import { z } from './zod-app'

export default defineNuxtPlugin({
  name: 'nuxt-zod-errors',
  enforce: 'pre',
  setup() {
    const appConfig = useAppConfig() as { zod?: { errors?: ZodErrorMessages } }
    const messages = appConfig.zod?.errors
    if (messages) {
      applyGlobalZodErrorMessages(messages)
      registerAppZodEffectiveBaseline(z)
    }
  },
})
