import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { registerNitroZodEffectiveBaseline } from '../../zod-context-config'
import { prepareNitroZodConfig } from '../../zod-config'
import { initZodRequestSwapState } from '../../zod-request-swap-state'
import type { ZodErrorMessages } from '../zod-errors'
import { applyGlobalZodErrorMessages } from '../zod-errors'
import { z } from '../zod-nitro'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', (event) => {
    initZodRequestSwapState(event.context)
    const path = event.path || event.node?.req?.url?.split('?')[0] || ''
    if (path.startsWith('/api')) {
      const runtimeConfig = useRuntimeConfig(event) as { nuxtZod?: { errors?: ZodErrorMessages } }
      applyGlobalZodErrorMessages(runtimeConfig.nuxtZod?.errors, { force: true })
      registerNitroZodEffectiveBaseline(z)
      prepareNitroZodConfig(z, undefined, event.context)
    }
  })
})
