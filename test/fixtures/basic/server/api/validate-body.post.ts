import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({
    body: z.object({ name: z.string().min(1) }),
  })
  return { ok: true, body }
})
