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

/** Both callbacks receive the issue fields shared by Zod 3 and Zod 4. */
export type ZodConfigLocaleError = ZodConfigCustomError

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

/** Public object with live namespace values and no `config` property. */
export function createPublicZodNamespace<T extends object>(
  zodNamespace: T,
  beforeAccess?: () => void,
): Omit<T, 'config'> {
  const publicNamespace = {} as Omit<T, 'config'>
  for (const key of Reflect.ownKeys(zodNamespace)) {
    if (key === 'config') continue
    Object.defineProperty(publicNamespace, key, {
      enumerable: Object.getOwnPropertyDescriptor(zodNamespace, key)?.enumerable,
      configurable: true,
      get() {
        beforeAccess?.()
        return Reflect.get(zodNamespace, key)
      },
    })
  }
  return publicNamespace
}

/** @deprecated Use {@link createPublicZodNamespace}. */
export const omitZodConfigMethod = createPublicZodNamespace
