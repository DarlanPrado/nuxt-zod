import { defineEventHandler } from 'h3'
import { z } from 'zod'

const schema = z.object({
  name: z.string().superRefine(async (value, ctx) => {
    await Promise.resolve()
    if (value !== 'nuxt-zod') {
      ctx.addIssue({ code: 'custom', message: 'Invalid async value' })
    }
  }),
})

export default defineEventHandler(async (event) => {
  const { body } = await event.validate({ body: schema })
  return { ok: true, body }
})
