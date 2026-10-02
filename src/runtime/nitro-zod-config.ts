let nitroInjectedConfig: Record<string, unknown> | undefined
let nitroConfigGeneration = 0

/** Nitro-only: consumer `server/plugins/*` calls this before handlers use `z`. */
export function registerInjectedZodConfig(config: Record<string, unknown>): void {
  nitroInjectedConfig = config
  nitroConfigGeneration++
}

export function getInjectedZodConfig(): Record<string, unknown> | undefined {
  return nitroInjectedConfig
}

export function getNitroConfigGeneration(): number {
  return nitroConfigGeneration
}
