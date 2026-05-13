import { useNuxtApp } from '#app'

/**
 * Returns the Zod `z` namespace (`zod/v3` when `nuxtZod.zodVersion` is `'v3'`).
 * Delegates to `$zod` from the nuxt-zod plugin so this module does not statically import Zod at the top level.
 *
 * @example
 * const z = useZod()
 * const schema = z.object({ name: z.string() })
 * schema.parse({ name: 'Nuxt' })
 */
export function useZod() {
  return useNuxtApp().$zod
}
