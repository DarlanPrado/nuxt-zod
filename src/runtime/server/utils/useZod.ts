import { z } from 'zod'

/**
 * Returns the Zod `z` namespace for schema creation and validation.
 * Auto-imported in all Nitro server code (routes, middleware, utils) by nuxt-zod.
 *
 * For an explicit import, use: import { z } from '#nuxt-zod/server'
 *
 * @example
 * export default defineEventHandler(async (event) => {
 *   const z = useZod()
 *   const schema = z.object({ name: z.string() })
 *   const body = await readBody(event)
 *   return schema.safeParse(body)
 * })
 */
export function useZod() {
  return z
}
