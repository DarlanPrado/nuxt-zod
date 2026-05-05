import { z } from 'zod'

export default {
  body: z.object({
    token: z.string().min(1),
  }),
}
