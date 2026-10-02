import { registerInjectedZodConfig } from '#nuxt-zod/server'

export default defineNitroPlugin(() => {
  registerInjectedZodConfig({
    customError: () => 'injected-nitro-zod-config',
  })
})
