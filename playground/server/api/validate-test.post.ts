export default defineEventHandler(async (event) => {
  const z = useZod()
  const { body, query } = await event.validate({
    body: z.object({ name: z.string().min(1) }),
    query: z.object({ page: z.coerce.number().optional() }),
  })
  return { ok: true, body, query }
})
