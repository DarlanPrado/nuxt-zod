import type { H3Event } from 'h3'

/** Test/fixture hook: yield after `readBody` before Nitro re-prepare (concurrency tests). */
export const NUXT_ZOD_POST_READ_BODY_YIELD_MS = '__nuxtZodPostReadBodyYieldMs'

export async function maybeYieldAfterNuxtZodReadBody(event: H3Event): Promise<void> {
  const context = event.context as Record<string, unknown>
  const yieldMs = context[NUXT_ZOD_POST_READ_BODY_YIELD_MS]
  if (typeof yieldMs === 'number' && yieldMs > 0) {
    await new Promise<void>(resolve => setTimeout(resolve, yieldMs))
  }
}
