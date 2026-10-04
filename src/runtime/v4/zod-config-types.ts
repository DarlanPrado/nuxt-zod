import type { z } from 'zod/v4'

export type ZodConfigInput = NonNullable<Parameters<typeof z.config>[0]>
