import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { body, query, params } = await event.validate({
    body: z.object({ name: z.string().min(1) }),
    query: z.object({ page: z.coerce.number() }),
    params: z.object({ id: z.coerce.number().int().positive() }),
  })
  return { ok: true, body, query, params }
})
