export type ZodRequestSwapState = {
  lastAppConfig?: Record<string, unknown>
  lastNitroConfig?: Record<string, unknown>
  /** Fresh `runtimeConfig.nuxtZod.errors` for this Nitro request (not module-setup snapshot). */
  nitroErrorMessages?: Record<string, unknown>
}

const ZOD_SWAP_CONTEXT_KEY = '__nuxtZodSwapState'

const moduleSwapFallback: ZodRequestSwapState = {}

export function initZodRequestSwapState(context: object): void {
  const bag = context as Record<string, unknown>
  bag[ZOD_SWAP_CONTEXT_KEY] = {}
}

export function getZodRequestSwapState(context?: object): ZodRequestSwapState {
  if (!context) {
    return moduleSwapFallback
  }
  const bag = context as Record<string, unknown>
  const existing = bag[ZOD_SWAP_CONTEXT_KEY] as ZodRequestSwapState | undefined
  if (existing) {
    return existing
  }
  const created: ZodRequestSwapState = {}
  bag[ZOD_SWAP_CONTEXT_KEY] = created
  return created
}
