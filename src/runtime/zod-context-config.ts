/**
 * Zod 4+ stores `z.config()` on `globalThis.__zod_globalConfig` (shared in one Node process).
 * App SSR and Nitro must not leak `$zodConfig` / `registerInjectedZodConfig` into each other.
 */

type ZodNamespaceWithConfig = {
  config?: (options: Record<string, unknown>) => void
  setErrorMap?: (map: unknown) => void
}

function getGlobalZodConfigRecord(): Record<string, unknown> {
  const global = globalThis as { __zod_globalConfig?: Record<string, unknown> }
  global.__zod_globalConfig ??= {}
  return global.__zod_globalConfig
}

function clearConfigKeys(config?: Record<string, unknown>): void {
  if (!config) {
    return
  }
  const globalConfig = getGlobalZodConfigRecord()
  for (const key of Object.keys(config)) {
    Reflect.deleteProperty(globalConfig, key)
  }
}

let nitroZodGlobalBaseline: Record<string, unknown> | undefined

/** Call once when the Nitro Zod entry module loads (before request handlers). */
export function captureNitroZodGlobalBaseline(): void {
  if (!nitroZodGlobalBaseline) {
    nitroZodGlobalBaseline = { ...getGlobalZodConfigRecord() }
  }
}

function restoreNitroZodGlobalBaseline(): void {
  captureNitroZodGlobalBaseline()
  const globalConfig = getGlobalZodConfigRecord()
  for (const key of Object.keys(globalConfig)) {
    Reflect.deleteProperty(globalConfig, key)
  }
  Object.assign(globalConfig, { ...nitroZodGlobalBaseline })
}

let activeContext: 'app' | 'nitro' | undefined
let lastAppConfig: Record<string, unknown> | undefined
let lastNitroConfig: Record<string, unknown> | undefined

function applyV3CustomError(
  zodNamespace: unknown,
  config: Record<string, unknown>,
): void {
  const zod = zodNamespace as ZodNamespaceWithConfig
  const customError = config.customError
  if (typeof zod.setErrorMap !== 'function' || typeof customError !== 'function') {
    return
  }
  zod.setErrorMap((issue: unknown, ctx: unknown) => {
    const ctxRecord = ctx && typeof ctx === 'object' ? ctx as Record<string, unknown> : undefined
    const fallback = typeof ctxRecord?.defaultError === 'string' ? ctxRecord.defaultError : 'Invalid input'
    const issueRecord = issue && typeof issue === 'object' ? issue as Record<string, unknown> : {}
    return {
      message: customError(issueRecord) ?? fallback,
    }
  })
}

function applyConfigObject(zodNamespace: unknown, config: Record<string, unknown>): void {
  const zod = zodNamespace as ZodNamespaceWithConfig
  if (typeof zod.config === 'function') {
    zod.config(config)
    return
  }
  applyV3CustomError(zodNamespace, config)
}

/**
 * Applies the consumer object as-is (no key filtering). Switches away from the other context first.
 */
export function prepareAppZodConfig(
  zodNamespace: unknown,
  config: Record<string, unknown> | undefined,
): void {
  if (activeContext === 'nitro') {
    clearConfigKeys(lastNitroConfig)
    lastNitroConfig = undefined
  }
  activeContext = 'app'
  lastAppConfig = config
  if (config) {
    applyConfigObject(zodNamespace, config)
  }
}

export function prepareNitroZodConfig(
  zodNamespace: unknown,
  config: Record<string, unknown> | undefined,
): void {
  if (activeContext === 'app') {
    clearConfigKeys(lastAppConfig)
    lastAppConfig = undefined
  }
  activeContext = 'nitro'
  lastNitroConfig = config
  if (config) {
    applyConfigObject(zodNamespace, config)
  }
  else {
    restoreNitroZodGlobalBaseline()
    if (typeof (zodNamespace as ZodNamespaceWithConfig).setErrorMap === 'function') {
      // Zod 3: error map lives on the namespace, not globalThis.
      ;(zodNamespace as ZodNamespaceWithConfig).setErrorMap?.(undefined as unknown)
    }
  }
}

/** Vitest: reset module state between unit tests. */
export function resetZodConfigContextState(): void {
  activeContext = undefined
  lastAppConfig = undefined
  lastNitroConfig = undefined
}
