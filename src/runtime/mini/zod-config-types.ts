import type * as z from 'zod/mini'

export type ZodConfigInput = NonNullable<Parameters<typeof z.config>[0]>
