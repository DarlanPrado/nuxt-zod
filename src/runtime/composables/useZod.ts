import { z } from 'zod'

/**
 * Returns the Zod `z` namespace for schema creation and validation.
 * Auto-imported in all app code by nuxt-zod.
 *
 * @example
 * const z = useZod()
 * const schema = z.object({ name: z.string() })
 * schema.parse({ name: 'Nuxt' })
 */
export function useZod() {
  return z
}
