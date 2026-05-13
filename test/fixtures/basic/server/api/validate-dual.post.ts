import { defineEventHandler } from 'h3'
import { z as zV3 } from 'zod/v3'
import { z as zV4 } from 'zod/v4'

export default defineEventHandler(async (event) => {
  const { body, query } = await event.validate({
    body: zV3.object({ name: zV3.string().min(1) }),
    query: zV4.object({ tag: zV4.string().min(1) }),
  })
  return { ok: true, body, query }
})
