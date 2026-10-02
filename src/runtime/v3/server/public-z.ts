import { getNuxtZodServerNamespace } from './zod-provider'

type ZodNamespace = typeof import('zod/v3').z

function resolveNamespace(): Omit<ZodNamespace, 'config'> {
  return getNuxtZodServerNamespace()
}

export const z: Omit<ZodNamespace, 'config'> = new Proxy({} as Omit<ZodNamespace, 'config'>, {
  get(_target, prop) {
    if (prop === 'config') {
      return undefined
    }
    const namespace = resolveNamespace()
    return Reflect.get(namespace as object, prop, namespace as object)
  },
  has(_target, prop) {
    if (prop === 'config') {
      return false
    }
    return Reflect.has(resolveNamespace() as object, prop)
  },
  ownKeys() {
    return Reflect.ownKeys(resolveNamespace() as object)
  },
  getOwnPropertyDescriptor(_target, prop) {
    if (prop === 'config') {
      return undefined
    }
    return undefined
  },
})
