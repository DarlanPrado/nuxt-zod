import { z } from 'zod'

/** Overridden by the consuming app layer — must not win. */
export default {
  body: z.object({
    source: z.literal('base-layer'),
  }),
}
