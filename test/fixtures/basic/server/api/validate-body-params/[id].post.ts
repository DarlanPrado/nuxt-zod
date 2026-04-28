import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { body, params } = await event.validate({
    body: z.object({ name: z.string().min(1) }),
    params: z.object({ id: z.coerce.number().int().positive() }),
  })
  return { ok: true, body, params }
})
