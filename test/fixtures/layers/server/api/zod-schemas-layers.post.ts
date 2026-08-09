export default defineEventHandler(async (event) => {
  const { baseOnly, sharedKey, appOnly } = useZodSchemas()
  const { body } = await event.validate({
    body: sharedKey.body,
  })
  return {
    ok: true,
    source: body.source,
    hasBaseOnly: !!baseOnly?.ping,
    hasAppOnly: !!appOnly?.ping,
  }
})
