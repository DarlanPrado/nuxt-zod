import { z as zRuntime } from 'zod/v4'
import { getNuxtZodServerNamespace } from './zod-provider'

export const z: Omit<typeof zRuntime, 'config'> = new Proxy({} as Omit<typeof zRuntime, 'config'>, {
  get(_target, prop) {
    if (prop === 'config') {
      return undefined
    }
    const namespace = getNuxtZodServerNamespace()
    const value = Reflect.get(namespace, prop, namespace)
    if (typeof value === 'function') {
      return value.bind(namespace)
    }
    return value
  },
  has(_target, prop) {
    if (prop === 'config') {
      return false
    }
    return Reflect.has(getNuxtZodServerNamespace(), prop)
  },
})
