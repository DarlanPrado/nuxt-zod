export default defineEventHandler(async (event) => {
  const z = useZod()
  const body = await readBody(event)
  const schema = z.object({ name: z.string() })
  const result = schema.safeParse(body)
  return { success: result.success, provider: 'mini' }
})
