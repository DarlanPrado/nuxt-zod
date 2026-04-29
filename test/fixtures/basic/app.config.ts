export default {
  zod: {
    errors: {
      string: {
        invalid_type: 'nao é um texto',
        min: 'texto muito curto',
      },
      number: {
        invalid_type: 'nao é um numero',
        min: 'numero muito pequeno',
      },
      iso: {
        date: 'Bad date!',
      },
      default: 'valor invalido',
    },
  },
}
