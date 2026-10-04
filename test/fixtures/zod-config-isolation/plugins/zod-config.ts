export default defineNuxtPlugin(() => ({
  provide: {
    zodConfig: {
      customError: () => 'isolation-app-message',
    },
  },
}))
