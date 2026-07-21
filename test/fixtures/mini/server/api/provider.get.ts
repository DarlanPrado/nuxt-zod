/**
 * Do not import `#nuxt-zod/server` in this fixture: it is only typed after `nuxt prepare`,
 * so the IDE / root typecheck cannot resolve it (same idea as fixtures/basic/server/api/validate.ts).
 * Assert Mini via the functional API instead (`z.minLength` is top-level only in zod/mini).
 */
export default defineEventHandler(() => {
  const z = useZod() as { minLength?: unknown }
  const providerId = typeof z.minLength === 'function' ? 'mini' : 'unknown'
  return { providerId }
})
