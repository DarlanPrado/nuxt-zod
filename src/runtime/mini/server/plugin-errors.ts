import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import type { ZodErrorMessages } from '../zod-errors'
import { applyGlobalZodErrorMessages } from '../zod-errors'

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig() as { nuxtZod?: { errors?: ZodErrorMessages } }
  applyGlobalZodErrorMessages(runtimeConfig.nuxtZod?.errors)
})
