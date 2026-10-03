import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { applyNitroRequestZodState } from '../../nitro-request-zod-hook'
import { initZodRequestSwapState } from '../../zod-request-swap-state'
import type { ZodErrorMessages } from '../zod-errors'
import { applyGlobalZodErrorMessages } from '../zod-errors'
import { z } from '../zod-nitro'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', (event) => {
    initZodRequestSwapState(event.context)
    const runtimeConfig = useRuntimeConfig(event) as { nuxtZod?: { errors?: ZodErrorMessages } }
    applyNitroRequestZodState(
      event,
      z,
      runtimeConfig.nuxtZod?.errors,
      applyGlobalZodErrorMessages,
    )
  })
})
