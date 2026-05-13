import { z } from 'zod/v3'

/**
 * Adapter para **`nuxtZod.zodVersion === 'v3'`**: apenas schemas Zod 3; sem `zod/v4` no grafo.
 * Para validação com schemas v3 **e** v4 no Nitro, o projecto deve usar `zodVersion: 'v4'` (`v4/zod-adapter.ts`).
 */
export type AnyZodSchema = z.ZodTypeAny

export async function safeParseAsync(
  schema: AnyZodSchema,
  data: unknown,
): Promise<
  | { success: true, data: unknown }
  | { success: false, error: { issues: unknown[] } }
> {
  return schema.safeParseAsync(data) as Promise<
    | { success: true, data: unknown }
    | { success: false, error: { issues: unknown[] } }
  >
}

type CustomErrorFn = (issue: Record<string, unknown>) => string | undefined

type ZodWithErrorHooks = {
  config?: (options: { customError?: CustomErrorFn }) => void
  setErrorMap?: (...args: unknown[]) => void
}

function asIssueRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Global Zod error customization for the configured provider (`zod/v3` only in this build).
 */
export function applyPeerZodErrorMaps(customError: CustomErrorFn): void {
  const zod = z as unknown as ZodWithErrorHooks
  if (typeof zod.config === 'function') {
    zod.config({ customError })
  }
  else if (typeof zod.setErrorMap === 'function') {
    zod.setErrorMap((issue: unknown, ctx: unknown) => {
      const ctxRecord = asIssueRecord(ctx)
      const fallback = asString(ctxRecord?.defaultError) ?? 'Invalid input'
      return {
        message: customError(asIssueRecord(issue) || {}) ?? fallback,
      }
    })
  }
}
