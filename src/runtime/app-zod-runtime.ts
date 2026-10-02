import { useRequestEvent } from '#app'
import { createPublicZodNamespace, prepareAppZodConfig } from './zod-config'

type AppZodRuntimeState<T extends object> = {
  rawZ: T
  sealed: boolean
  publicZod: Omit<T, 'config'> | undefined
}

const appStates = new WeakMap<object, AppZodRuntimeState<object>>()

function readZodConfig(nuxtApp: object): Record<string, unknown> | undefined {
  return (nuxtApp as { $zodConfig?: Record<string, unknown> }).$zodConfig
}

function getState<T extends object>(nuxtApp: object, rawZ: T): AppZodRuntimeState<T> {
  let state = appStates.get(nuxtApp) as AppZodRuntimeState<T> | undefined
  if (!state) {
    state = {
      rawZ,
      sealed: false,
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
  const requestContext = import.meta.server ? useRequestEvent()?.context : undefined
  const beforeParse = () => {
    prepareAppZodConfig(state.rawZ, readZodConfig(nuxtApp), requestContext)
  }
  beforeParse()
  state.publicZod ??= createPublicZodNamespace(state.rawZ, { beforeParse })
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
  return new Proxy({} as Omit<T, 'config'>, {
    get(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      const namespace = resolveAppZodNamespace<T>(nuxtApp)
      return Reflect.get(namespace, prop, namespace)
    },
    has(_target, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(resolveAppZodNamespace<T>(nuxtApp), prop)
    },
    ownKeys() {
      return Reflect.ownKeys(resolveAppZodNamespace<T>(nuxtApp))
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      return Reflect.getOwnPropertyDescriptor(resolveAppZodNamespace<T>(nuxtApp), prop)
    },
  })
}
