export default defineEventHandler(() => {
  const { session } = useZodSchemas()
  return { ok: true, schemaKeys: Object.keys(session) }
})
