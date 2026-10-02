import type { z } from 'zod/v4'
import { createNitroZodAccessProxy } from '../zod-provider'

/**
 * Returns the Zod 4 Classic `z` namespace when `nuxtZod.zodVersion` is `'v4'`.
 * Auto-imported in Nitro by nuxt-zod.
 */
export function useZod(): Omit<typeof z, 'config'> {
  return createNitroZodAccessProxy()
}
