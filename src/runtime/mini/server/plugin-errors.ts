import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import type { ZodErrorMessages } from '../zod-errors'
import { applyGlobalZodErrorMessages } from '../zod-errors'
import { registerNitroZodEffectiveBaseline, registerNitroZodModuleErrorMessages } from '../../zod-context-config'
import { z } from '../zod-nitro'

export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig() as { nuxtZod?: { errors?: ZodErrorMessages } }
  const messages = runtimeConfig.nuxtZod?.errors
  registerNitroZodModuleErrorMessages(
    messages as Record<string, unknown> | undefined,
    next => applyGlobalZodErrorMessages(next as ZodErrorMessages, { force: true }),
  )
  applyGlobalZodErrorMessages(messages)
  registerNitroZodEffectiveBaseline(z)
})
