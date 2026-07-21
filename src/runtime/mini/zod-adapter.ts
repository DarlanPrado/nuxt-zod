/**
 * Adapter for **`nuxtZod.zodVersion === 'mini'`** (pasta `mini/` = *modo* do módulo).
 *
 * 1. **`event.validate()` / Nitro** — o contrato público permite schemas **Zod 3, Zod 4 Classic ou Zod Mini** na mesma API;
 *    por isso `AnyZodSchema`, `isZod4Schema` e `safeParseAsync` despacham para `zod/v3` ou `zod/v4/core`.
 * 2. **`app.config` → `zod.errors`** — mensagens globais aplicam-se ao namespace **`zod/mini`** (provider)
 *    e ao permalink **`zod/v3`**, para código que ainda importa v3 directamente.
 *
 * @see https://zod.dev/packages/mini
 * @see https://zod.dev/library-authors
 */
import { z as zV3Permalink } from 'zod/v3'
import { safeParseAsync as safeParseAsyncV4Core, type $ZodType } from 'zod/v4/core'
import * as zProvider from 'zod/mini'

/** Schema aceite em `event.validate()` neste modo: instância Zod 3 **ou** Zod 4 / Mini. */
export type AnyZodSchema = zV3Permalink.ZodTypeAny | $ZodType

/** Zod 4 / Mini schemas expose `_zod`; Zod 3 uses `_def`. @see https://zod.dev/library-authors */
export function isZod4Schema(schema: unknown): schema is $ZodType {
  return typeof schema === 'object' && schema !== null && '_zod' in schema
}

export type SafeParseUnion
  = | { success: true, data: unknown }
    | { success: false, error: { issues: unknown[] } }

/**
 * Implementa o contrato dual de `event.validate()` (`AnyZodSchemaPublic` em `validation-types.ts`):
 * aceitar instâncias vindas de `zod/v3`, `zod/v4` ou `zod/mini`.
 */
export async function safeParseAsync(
  schema: AnyZodSchema,
  data: unknown,
): Promise<SafeParseUnion> {
  if (isZod4Schema(schema)) {
    return safeParseAsyncV4Core(schema, data) as Promise<SafeParseUnion>
  }
  return (schema as zV3Permalink.ZodTypeAny).safeParseAsync(data) as Promise<SafeParseUnion>
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
 * Registers global Zod error customization for the configured provider (`zod/mini`)
 * and for code that still imports `zod/v3` directly.
 */
export function applyPeerZodErrorMaps(customError: CustomErrorFn): void {
  const targets: ZodWithErrorHooks[] = [
    zProvider as unknown as ZodWithErrorHooks,
    zV3Permalink as unknown as ZodWithErrorHooks,
  ]

  for (const zod of targets) {
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
}
