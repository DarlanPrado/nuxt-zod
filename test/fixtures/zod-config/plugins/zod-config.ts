export default defineNuxtPlugin({
  name: 'consumer-zod-config',
  setup: () => ({
    provide: {
      zodConfig: {
        customError: () => 'injected-app-zod-config',
      },
    },
  }),
})
