/**
 * Zod 4.4+ uses `globalThis.__zod_globalConfig`; older Zod 4 reads/writes via `z.config()`.
 * App SSR and Nitro share one namespace per side entry — isolate by swapping config when
 * entering each side and immediately before parse (see `createPublicZodNamespace`).
 */
import { readNitroInjectedZodConfig } from './nitro-zod-config'
import { getZodRequestSwapState } from './zod-request-swap-state'

type ZodNamespaceWithConfig = {
  config?: (options?: Record<string, unknown>) => unknown
  setErrorMap?: (map: unknown) => void
}

type V3DefaultErrorMapRestorer = (zodNamespace: unknown) => void

let v3RestoreDefaultErrorMap: V3DefaultErrorMapRestorer | undefined

/** Registered from `v3/zod-nitro.ts` (and app entry) so shared code stays free of `zod/v3` imports. */
export function registerV3DefaultErrorMapRestorer(restorer: V3DefaultErrorMapRestorer): void {
  v3RestoreDefaultErrorMap = restorer
}

function getGlobalZodConfigRecord(): Record<string, unknown> | undefined {
  const global = globalThis as { __zod_globalConfig?: Record<string, unknown> }
  return global.__zod_globalConfig
}

function readConfigState(zodNamespace: unknown): Record<string, unknown> {
  const zod = zodNamespace as ZodNamespaceWithConfig
  if (typeof zod.config === 'function') {
    const current = zod.config()
    if (current && typeof current === 'object') {
      return { ...(current as Record<string, unknown>) }
    }
  }
  const globalConfig = getGlobalZodConfigRecord()
  return globalConfig ? { ...globalConfig } : {}
}

function writeConfigState(zodNamespace: unknown, next: Record<string, unknown>): void {
  const zod = zodNamespace as ZodNamespaceWithConfig
  const current = readConfigState(zodNamespace)
  const resetPayload: Record<string, unknown> = {}
  for (const key of Object.keys(current)) {
    resetPayload[key] = undefined
  }
  if (typeof zod.config === 'function') {
    if (Object.keys(resetPayload).length > 0) {
      zod.config(resetPayload)
    }
    zod.config(next)
    return
  }
  const globalConfig = getGlobalZodConfigRecord()
  if (globalConfig) {
    for (const key of Object.keys(globalConfig)) {
      Reflect.deleteProperty(globalConfig, key)
    }
    Object.assign(globalConfig, next)
  }
}

let appZodEffectiveBaseline: Record<string, unknown> | undefined
let nitroZodEffectiveBaseline: Record<string, unknown> | undefined

/** After `zod.errors` is applied on the app runtime (`nuxt-zod-errors`). */
export function registerAppZodEffectiveBaseline(zodNamespace: unknown): void {
  const state = readConfigState(zodNamespace)
  if (Object.keys(state).length > 0) {
    appZodEffectiveBaseline = state
  }
}

/** After `zod.errors` / Nitro runtime messages are applied (server plugin-errors). */
export function registerNitroZodEffectiveBaseline(zodNamespace: unknown): void {
  const state = readConfigState(zodNamespace)
  if (Object.keys(state).length > 0) {
    nitroZodEffectiveBaseline = state
  }
}

function restoreV3DefaultErrorMap(zodNamespace: unknown): void {
  v3RestoreDefaultErrorMap?.(zodNamespace)
}

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

function restoreNitroEffectiveBaseline(zodNamespace: unknown): void {
  if (nitroZodEffectiveBaseline && Object.keys(nitroZodEffectiveBaseline).length > 0) {
    writeConfigState(zodNamespace, { ...nitroZodEffectiveBaseline })
    return
  }
  restoreV3DefaultErrorMap(zodNamespace)
}

/** Nitro: re-apply `nuxtZod.errors` when baseline restore is not enough (shared global config). */
let nitroModuleErrorMessages: Record<string, unknown> | undefined
let reapplyNitroModuleErrorMessages: ((messages: Record<string, unknown>) => void) | undefined

export function registerNitroZodModuleErrorMessages(
  messages: Record<string, unknown> | undefined,
  reapply: (messages: Record<string, unknown>) => void,
): void {
  nitroModuleErrorMessages = messages
  reapplyNitroModuleErrorMessages = reapply
}

function restoreAppEffectiveBaseline(zodNamespace: unknown): void {
  if (appZodEffectiveBaseline && Object.keys(appZodEffectiveBaseline).length > 0) {
    writeConfigState(zodNamespace, { ...appZodEffectiveBaseline })
    return
  }
  restoreV3DefaultErrorMap(zodNamespace)
}

/**
 * Applies the consumer object as-is (no key filtering).
 */
export function prepareAppZodConfig(
  zodNamespace: unknown,
  config: Record<string, unknown> | undefined,
  requestContext?: object,
): void {
  void getZodRequestSwapState(requestContext)
  writeConfigState(zodNamespace, {})
  restoreAppEffectiveBaseline(zodNamespace)
  if (config) {
    applyConfigObject(zodNamespace, config)
  }
}

export function prepareNitroZodConfig(
  zodNamespace: unknown,
  explicitConfig: Record<string, unknown> | undefined,
  requestContext?: object,
): void {
  void getZodRequestSwapState(requestContext)
  writeConfigState(zodNamespace, {})
  if (nitroModuleErrorMessages && reapplyNitroModuleErrorMessages) {
    reapplyNitroModuleErrorMessages(nitroModuleErrorMessages)
  }
  else {
    restoreNitroEffectiveBaseline(zodNamespace)
  }
  const resolvedConfig = explicitConfig ?? readNitroInjectedZodConfig()
  if (resolvedConfig) {
    applyConfigObject(zodNamespace, resolvedConfig)
  }
}

/** Vitest: reset module state between unit tests. */
export function resetZodConfigContextState(): void {
  appZodEffectiveBaseline = undefined
  nitroZodEffectiveBaseline = undefined
}
