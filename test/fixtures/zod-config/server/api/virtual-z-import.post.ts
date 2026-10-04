import { z } from '#nuxt-zod/server'

export default defineEventHandler(() => {
  const parsed = z.string().safeParse(123)
  const message = parsed.success
    ? 'no-error'
    : parsed.error.issues[0]?.message ?? 'no-message'
  const configHidden = !('config' in z) && !Object.keys(z).includes('config')
  const publicKeyCount = Object.keys(z).length
  const stringDescriptor = Object.getOwnPropertyDescriptor(z, 'string')
  return {
    message,
    configHidden,
    publicKeyCount,
    stringDescriptorType: stringDescriptor === undefined ? 'undefined' : typeof stringDescriptor.value,
  }
})
