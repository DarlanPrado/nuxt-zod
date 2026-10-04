const NITRO_INJECTED_GLOBAL_KEY = '__nuxtZodNitroInjectedConfig'

let nitroInjectedConfig: Record<string, unknown> | undefined
let nitroConfigGeneration = 0

function syncInjectedConfigGlobal(config: Record<string, unknown> | undefined): void {
  const global = globalThis as Record<string, unknown>
  if (config) {
    global[NITRO_INJECTED_GLOBAL_KEY] = config
  }
  else {
    Reflect.deleteProperty(global, NITRO_INJECTED_GLOBAL_KEY)
  }
}

/** Nitro-only: consumer `server/plugins/*` calls this before handlers use `z`. */
export function registerInjectedZodConfig(config: Record<string, unknown>): void {
  nitroInjectedConfig = config
  nitroConfigGeneration++
  syncInjectedConfigGlobal(config)
}

export function getInjectedZodConfig(): Record<string, unknown> | undefined {
  return nitroInjectedConfig
}

export function getNitroConfigGeneration(): number {
  return nitroConfigGeneration
}

/** Applies `registerInjectedZodConfig` unless an explicit object was passed to `prepareNitroZodConfig`. */
export function readNitroInjectedZodConfig(): Record<string, unknown> | undefined {
  const fromGlobal = (globalThis as Record<string, unknown>)[NITRO_INJECTED_GLOBAL_KEY]
  if (fromGlobal && typeof fromGlobal === 'object') {
    return fromGlobal as Record<string, unknown>
  }
  return nitroInjectedConfig
}

export function applyInjectedZodConfigIfNeeded(
  zodNamespace: unknown,
  explicitConfig: Record<string, unknown> | undefined,
  apply: (namespace: unknown, config: Record<string, unknown>) => void,
): void {
  const resolved = explicitConfig ?? readNitroInjectedZodConfig()
  if (resolved) {
    apply(zodNamespace, resolved)
  }
}
