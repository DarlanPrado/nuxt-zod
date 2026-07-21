import * as z from 'zod/mini'

const base = z.object({
  id: z.number(),
  name: z.string(),
})

export default {
  base,
  create: z.object({
    name: z.string(),
  }),
}
