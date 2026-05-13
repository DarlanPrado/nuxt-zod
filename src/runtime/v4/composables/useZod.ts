import { useNuxtApp } from '#app'

/**
 * Returns the Zod 4 Classic `z` namespace when `nuxtZod.zodVersion` is `'v4'`.
 * Delegates to `$zod` from the nuxt-zod plugin so this module does not statically import Zod at the top level.
 */
export function useZod() {
  return useNuxtApp().$zod
}
