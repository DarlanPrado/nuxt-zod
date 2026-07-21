import * as z from 'zod/mini'

export default {
  body: z.object({
    token: z.string().check(z.minLength(1)),
  }),
}
