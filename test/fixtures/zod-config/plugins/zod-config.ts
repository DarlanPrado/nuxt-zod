export default defineNuxtPlugin(() => ({
  provide: {
    zodConfig: {
      customError: () => 'injected-app-zod-config',
    },
  },
}))
