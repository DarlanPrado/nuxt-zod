import { useNuxtApp } from '#app'

/**
 * Returns the Zod Mini `z` namespace when `nuxtZod.zodVersion` is `'mini'`.
 * Delegates to `$zod` from the nuxt-zod plugin so this module does not statically import Zod at the top level.
 */
export function useZod() {
  return useNuxtApp().$zod
}
