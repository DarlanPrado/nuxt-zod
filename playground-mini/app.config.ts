export default defineAppConfig({
  zod: {
    errors: {
      string: {
        invalid_type: 'nao é um texto',
        min: 'muito curto',
      },
      default: 'valor invalido',
    },
  },
})
