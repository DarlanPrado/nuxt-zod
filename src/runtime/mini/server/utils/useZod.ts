import type * as z from 'zod/mini'
import { getNuxtZodServerNamespace } from '../zod-provider'

/**
 * Returns the Zod Mini namespace when `nuxtZod.zodVersion` is `'mini'`.
 * Auto-imported in Nitro by nuxt-zod.
 */
export function useZod(): typeof z {
  return getNuxtZodServerNamespace()
}
