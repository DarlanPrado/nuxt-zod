export default defineEventHandler(async (event) => {
  const z = useZod()
  const { body } = await event.validate({
    body: z.object({
      name: z.string().check(z.minLength(1)),
    }),
  })
  return { ok: true, body, provider: 'mini' }
})
