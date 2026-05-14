export default defineEventHandler(() => {
  const z = useZod()
  return { ok: z.number().safeParse(1).success }
})
