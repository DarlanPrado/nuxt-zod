import { defineEventHandler } from 'h3'
import * as z from 'zod/mini'

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({
    body: z.object({ name: z.string().check(z.minLength(1)) }),
  })
  return { ok: true, body }
})
