export default defineEventHandler(async (event) => {
  const z = useZod()
  const bodySchema = z.object({ name: z.string() })
  await new Promise<void>(resolve => setTimeout(resolve, 200))
  await event.validate({ body: bodySchema })
  return { ok: true }
})
