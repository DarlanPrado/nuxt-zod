import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { body, query } = await event.validate({
    body: z.object({ name: z.string() }),
    query: z.object({ page: z.coerce.number().optional() }),
  })

  return { ok: true, body, query }
})
