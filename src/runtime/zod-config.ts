/**
 * Public Zod namespace helpers (no `zod/v4` import — shared across v3/v4/mini trees).
 */
export { prepareAppZodConfig, prepareNitroZodConfig } from './zod-context-config'

/**
 * Public Zod namespace without `config` (issue #38). Target is an empty object so `in` / traps
 * stay consistent when the real Zod namespace has a non-configurable `config` property.
 */
export function createPublicZodNamespace<T extends object>(zodNamespace: T): Omit<T, 'config'> {
  return new Proxy({} as Omit<T, 'config'>, {
    get(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      const value = Reflect.get(zodNamespace, prop, zodNamespace)
      if (typeof value === 'function') {
        return value.bind(zodNamespace)
      }
      return value
    },
    has(_target, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(zodNamespace, prop)
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      return Reflect.getOwnPropertyDescriptor(zodNamespace, prop)
    },
  })
}
