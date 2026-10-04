export default defineEventHandler(async (event) => {
  event.context.__nuxtZodPostReadBodyYieldMs = 200
  const z = useZod()
  const bodySchema = z.object({ name: z.string() })
  await event.validate({ body: bodySchema })
  return { ok: true }
})
