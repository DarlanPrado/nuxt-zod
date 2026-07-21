import * as z from 'zod/mini'

export default {
  create: z.object({
    name: z.string().check(z.minLength(1)),
  }),
}
