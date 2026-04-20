// Demonstrates explicit server import: import { z } from '#nuxt-zod/server'
// As an alternative, useZod() is auto-imported and available without any import.
import { z } from '#nuxt-zod/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const schema = z.object({ name: z.string() })
  const result = schema.safeParse(body)
  return { success: result.success }
})
