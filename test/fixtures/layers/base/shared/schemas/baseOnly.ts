import { z } from 'zod'

export default {
  ping: z.object({
    from: z.literal('base'),
  }),
}
