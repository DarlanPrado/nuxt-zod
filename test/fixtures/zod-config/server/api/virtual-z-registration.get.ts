import { z, registerInjectedZodConfig } from '#nuxt-zod/server'

export default defineEventHandler(() => {
  try {
    registerInjectedZodConfig({ customError: () => 'updated virtual config' })
    const parsed = z.string().safeParse(123)
    return { message: parsed.success ? 'no-error' : parsed.error.issues[0]?.message }
  }
  finally {
    registerInjectedZodConfig({ customError: () => 'injected-nitro-zod-config' })
  }
})
