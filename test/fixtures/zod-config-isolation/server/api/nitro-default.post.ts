export default defineEventHandler(() => {
  const z = useZod()
  const parsed = z.string().safeParse(123)
  const message = parsed.success
    ? 'no-error'
    : parsed.error.issues[0]?.message ?? 'no-message'
  const configIn = 'config' in z
  const configDescriptor = Object.getOwnPropertyDescriptor(z, 'config')
  return {
    message,
    configIn,
    configDescriptorType: configDescriptor === undefined ? 'undefined' : typeof configDescriptor.value,
  }
})
