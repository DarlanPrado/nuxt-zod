import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { params } = await event.validate({
    params: z.object({ slug: z.string().min(2) }),
  })
  return { ok: true, params }
})
