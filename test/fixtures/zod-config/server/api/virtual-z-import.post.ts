import { z } from '#nuxt-zod/server'

export default defineEventHandler(() => {
  const parsed = z.string().safeParse(123)
  const message = parsed.success
    ? 'no-error'
    : parsed.error.issues[0]?.message ?? 'no-message'
  const configHidden = typeof z.config === 'undefined'
  return { message, configHidden }
})
