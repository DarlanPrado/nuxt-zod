import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  await event.validate({} as never)
  return { ok: true }
})
