import { getNuxtZodServerNamespace } from './zod-provider'

type ZodNamespace = typeof import('zod/v3').z

export const z: Omit<ZodNamespace, 'config'> = new Proxy({} as Omit<ZodNamespace, 'config'>, {
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
  getOwnPropertyDescriptor(_target, prop) {
    if (prop === 'config') {
      return undefined
    }
    return Reflect.getOwnPropertyDescriptor(getNuxtZodServerNamespace(), prop)
  },
})
