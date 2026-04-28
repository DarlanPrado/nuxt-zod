import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  await event.validate(
    { body: z.object({ name: z.string() }) },
    { statusCode: 422, message: 'Local status override' },
  )

  return { ok: true }
})
