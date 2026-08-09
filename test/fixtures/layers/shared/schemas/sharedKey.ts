import { z } from 'zod'

/** Higher-priority override of base/shared/schemas/sharedKey.ts */
export default {
  body: z.object({
    source: z.literal('app-layer'),
  }),
}
