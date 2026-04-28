import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  await event.validate({
    body: z.object({ name: z.string().min(3) }),
    query: z.object({ page: z.coerce.number().int().positive() }),
    params: z.object({ id: z.coerce.number().int().positive() }),
  })

  return { ok: true }
})
