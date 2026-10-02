import type { ZodConfigInput } from './zod-config'
import { applyZodConfigToNamespace, createPublicZodNamespace } from './zod-config'

type AppZodRuntimeState<T extends object> = {
  rawZ: T
  sealed: boolean
  lastConfig: ZodConfigInput | undefined
  publicZod: Omit<T, 'config'> | undefined
}

const appStates = new WeakMap<object, AppZodRuntimeState<object>>()

function readZodConfig(nuxtApp: object): ZodConfigInput | undefined {
  return (nuxtApp as { $zodConfig?: ZodConfigInput }).$zodConfig
}

function getState<T extends object>(nuxtApp: object, rawZ: T): AppZodRuntimeState<T> {
  let state = appStates.get(nuxtApp) as AppZodRuntimeState<T> | undefined
  if (!state) {
    state = {
      rawZ,
      sealed: false,
      lastConfig: undefined,
      publicZod: undefined,
    }
    appStates.set(nuxtApp, state)
  }
  return state
}

export function initAppZodRuntime<T extends object>(nuxtApp: object, rawZ: T): void {
  getState(nuxtApp, rawZ)
}

export function resolveAppZodNamespace<T extends object>(
  nuxtApp: object,
): Omit<T, 'config'> {
  const state = appStates.get(nuxtApp) as AppZodRuntimeState<T> | undefined
  if (!state) {
    throw new Error('[nuxt-zod] App Zod runtime is not initialized yet.')
  }

  const config = readZodConfig(nuxtApp)
  applyZodConfigToNamespace(state.rawZ, config)
  if (!state.sealed || config !== state.lastConfig) {
    state.publicZod = createPublicZodNamespace(state.rawZ)
    state.lastConfig = config
  }

  if (!state.publicZod) {
    state.publicZod = createPublicZodNamespace(state.rawZ)
  }

  return state.publicZod
}

export function sealAppZodRuntime(nuxtApp: object): void {
  const state = appStates.get(nuxtApp)
  if (!state) {
    return
  }
  resolveAppZodNamespace(nuxtApp)
  state.sealed = true
}

export function createAppZodAccessProxy<T extends object>(
  nuxtApp: object,
): Omit<T, 'config'> {
  const state = appStates.get(nuxtApp) as AppZodRuntimeState<T> | undefined
  if (!state) {
    throw new Error('[nuxt-zod] App Zod runtime is not initialized yet.')
  }
  return createPublicZodNamespace(
    state.rawZ,
    () => resolveAppZodNamespace<T>(nuxtApp),
  )
}
