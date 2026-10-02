export default defineNuxtPlugin({
  dependsOn: ['consumer-zod-config'],
  setup(nuxtApp) {
    const parsed = nuxtApp.$zod.string().safeParse(123)
    return {
      provide: {
        zodConsumerResult: !parsed.success && parsed.error.issues[0]?.message === 'injected-app-zod-config'
          ? 'consumer-plugin-ok'
          : 'consumer-plugin-failed',
      },
    }
  },
})
