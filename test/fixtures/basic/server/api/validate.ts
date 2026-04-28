// In real apps you can use: import { z } from '#nuxt-zod/server' (see module types).
// `zod` is used here so the root `vue-tc` run (which typechecks this file) resolves without fixture-only path tricks.
import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const schema = z.object({ name: z.string() })
  const result = schema.safeParse(body)
  return { success: result.success }
})
