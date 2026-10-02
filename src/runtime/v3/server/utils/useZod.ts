import type { z } from 'zod/v3'
import { getNuxtZodServerNamespace } from '../zod-provider'

/**
 * Returns the Zod 3 `z` namespace when `nuxtZod.zodVersion` is `'v3'`.
 * Auto-imported in Nitro by nuxt-zod.
 */
export function useZod(): Omit<typeof z, 'config'> {
  return getNuxtZodServerNamespace()
}
