/**
 * Neutral helpers for consumer `$zodConfig` / Nitro `registerInjectedZodConfig`.
 * MUST NOT import `zod/v4` (shared across v3/v4/mini trees).
 */

export type ZodConfigInput = {
  customError?: (issue: unknown) => string | undefined
  localeError?: unknown
  jitless?: boolean
} & Record<string, unknown>

let nitroInjectedConfig: ZodConfigInput | undefined

/** Nitro-only: consumer `server/plugins/*` calls this before the module applies config. */
export function registerInjectedZodConfig(config: ZodConfigInput): void {
  nitroInjectedConfig = config
}

export function getInjectedZodConfig(): ZodConfigInput | undefined {
  return nitroInjectedConfig
}

function asIssueRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

type ZodNamespaceWithConfig = {
  config?: (options: ZodConfigInput) => void
  setErrorMap?: (map: unknown) => void
}

/**
 * Applies a `z.config`-shaped object to a Zod namespace (v4/mini `config`, v3 `setErrorMap` fallback).
 */
export function applyZodConfigToNamespace(
  zodNamespace: unknown,
  config: ZodConfigInput | undefined,
): void {
  if (!config || typeof config !== 'object') {
    return
  }

  const zod = zodNamespace as ZodNamespaceWithConfig

  if (typeof zod.config === 'function') {
    zod.config(config)
    return
  }

  const customError = config.customError
  if (typeof zod.setErrorMap === 'function' && typeof customError === 'function') {
    zod.setErrorMap((issue: unknown, ctx: unknown) => {
      const ctxRecord = asIssueRecord(ctx)
      const fallback = asString(ctxRecord?.defaultError) ?? 'Invalid input'
      return {
        message: customError(asIssueRecord(issue) || {}) ?? fallback,
      }
    })
  }
}

/**
 * Hides `config` on the namespace exposed as `$zod` / `useZod()` (issue #38).
 */
export function omitZodConfigMethod<T extends object>(zodNamespace: T): T {
  return new Proxy(zodNamespace, {
    get(target, prop, receiver) {
      if (prop === 'config') {
        return undefined
      }
      return Reflect.get(target, prop, receiver)
    },
    has(target, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(target, prop)
    },
    ownKeys(target) {
      return Reflect.ownKeys(target).filter(key => key !== 'config')
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'config') {
        return undefined
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  }) as T
}
