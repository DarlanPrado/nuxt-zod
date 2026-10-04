export default defineEventHandler(async (event) => {
  const { session } = useZodSchemas()
  const { body } = await event.validate({ body: session.login })
  return { ok: true, email: body.email }
})
