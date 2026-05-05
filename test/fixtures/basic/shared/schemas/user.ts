import { z } from 'zod'

const base = z.object({
  id: z.number(),
  name: z.string(),
})

export default {
  base,
  create: base.omit({ id: true }),
}
