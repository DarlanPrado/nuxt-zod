export default defineEventHandler(async (event) => {
  const { auth } = useZodSchemas()
  const { body } = await event.validate({ body: auth.login.body })
  return { ok: true, token: body.token }
})
