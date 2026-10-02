/**
 * Neutral helpers for consumer `$zodConfig` / Nitro `registerInjectedZodConfig`.
 * MUST NOT import `zod/v4` (shared across v3/v4/mini trees).
 */

/** Minimal issue shape shared by Zod 3 and Zod 4 customError callbacks. */
export type ZodConfigIssue = {
  code?: string
  message?: string
  path?: PropertyKey[]
  [key: string]: unknown
}

export type ZodConfigCustomError = (issue: ZodConfigIssue) => string | undefined

/** Locale helpers are version-specific; keep a callable surface without importing Zod. */
export type ZodConfigLocaleError = (...args: unknown[]) => unknown

export type ZodConfigInput = {
  customError?: ZodConfigCustomError
  localeError?: ZodConfigLocaleError
  jitless?: boolean
} & Record<string, unknown>

let nitroInjectedConfig: ZodConfigInput | undefined
let nitroConfigGeneration = 0

/** Nitro-only: consumer `server/plugins/*` calls this before handlers use `z`. */
export function registerInjectedZodConfig(config: ZodConfigInput): void {
  nitroInjectedConfig = config
  nitroConfigGeneration++
}

export function getInjectedZodConfig(): ZodConfigInput | undefined {
  return nitroInjectedConfig
}

export function getNitroConfigGeneration(): number {
  return nitroConfigGeneration
}

function asIssueRecord(value: unknown): ZodConfigIssue | undefined {
  return value && typeof value === 'object' ? value as ZodConfigIssue : undefined
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
 * Public Zod namespace without `config` (issue #38). Uses a get-only proxy so non-configurable
 * `config` on the target does not break trap invariants.
 */
export function createPublicZodNamespace<T extends object>(zodNamespace: T): Omit<T, 'config'> {
  return new Proxy(zodNamespace, {
    get(target, prop, receiver) {
      if (prop === 'config') {
        return undefined
      }
      const value = Reflect.get(target, prop, receiver)
      if (typeof value === 'function') {
        return value.bind(target)
      }
      return value
    },
    has(target, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(target, prop)
    },
  }) as Omit<T, 'config'>
}

/** @deprecated Use {@link createPublicZodNamespace}. */
export const omitZodConfigMethod = createPublicZodNamespace
