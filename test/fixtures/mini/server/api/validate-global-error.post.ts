import { defineEventHandler, readBody } from 'h3'
import * as z from 'zod/mini'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const mode = body?.mode as string | undefined

  const schema = mode === 'schema'
    ? z.object({ name: z.string().check(z.minLength(4, 'schema-level-priority')) })
    : z.object({ name: z.string().check(z.minLength(4)) })

  const result = schema.safeParse(body)
  if (result.success) {
    return { ok: true, data: result.data }
  }

  return {
    ok: false,
    message: result.error.issues[0]?.message,
  }
})
