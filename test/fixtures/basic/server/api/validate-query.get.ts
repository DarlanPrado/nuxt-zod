import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { query } = await event.validate({
    query: z.object({ page: z.coerce.number() }),
  })
  return { ok: true, query }
})
