export default defineEventHandler(async () => {
  const z = useZod()
  await new Promise<void>(resolve => setTimeout(resolve, 200))
  const parsed = z.string().safeParse(123)
  const message = parsed.success
    ? 'no-error'
    : parsed.error.issues[0]?.message ?? 'no-message'
  return { message }
})
