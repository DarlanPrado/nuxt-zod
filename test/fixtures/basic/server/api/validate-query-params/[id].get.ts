import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { query, params } = await event.validate({
    query: z.object({ page: z.coerce.number() }),
    params: z.object({ id: z.coerce.number().int().positive() }),
  })
  return { ok: true, query, params }
})
