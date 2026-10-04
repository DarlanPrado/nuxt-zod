import { useNuxtApp } from '#app'

/**
 * Delegates to `$zod` from the nuxt-zod plugin so this module does not statically import Zod at the top level.
 *
 * @example
 * const z = useZod()
 * const schema = z.object({ name: z.string() })
 */
export function useZod() {
  return useNuxtApp().$zod
}
