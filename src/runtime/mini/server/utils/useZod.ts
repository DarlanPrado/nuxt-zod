import { createNitroZodAccessProxy } from '../zod-provider'

/**
 * Returns the Zod Mini namespace when `nuxtZod.zodVersion` is `'mini'`.
 * Auto-imported in Nitro by nuxt-zod.
 */
export function useZod() {
  return createNitroZodAccessProxy()
}
