export default defineEventHandler(() => {
  const z = useZod() as { minLength?: unknown }
  return {
    providerId: typeof z.minLength === 'function' ? 'mini' : 'unknown',
  }
})
