import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const zodMaybeIso = z as typeof z & {
    iso?: {
      date?: () => { safeParse: (value: unknown) => { success: boolean, error?: { issues?: Array<{ message?: string }> } } }
    }
  }

  if (!zodMaybeIso.iso?.date) {
    return { supported: false }
  }

  const result = zodMaybeIso.iso.date().safeParse(body?.value)
  if (result.success) {
    return { supported: true, ok: true }
  }

  return {
    supported: true,
    ok: false,
    message: result.error?.issues?.[0]?.message,
  }
})
