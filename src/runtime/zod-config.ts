/**
 * Public Zod namespace helpers (no `zod/v4` import — shared across v3/v4/mini trees).
 */
import { descriptorForEmptyProxyTarget } from './proxy-descriptor'

export { prepareAppZodConfig, prepareNitroZodConfig } from './zod-context-config'

const PARSE_METHODS = new Set(['parse', 'safeParse', 'parseAsync', 'safeParseAsync'])

function wrapParseMethods(value: unknown, beforeParse: () => void): unknown {
  if (!value || typeof value !== 'object') {
    return value
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.safeParse !== 'function' && typeof candidate.parse !== 'function') {
    return value
  }
  return new Proxy(value as object, {
    get(target, prop, receiver) {
      if (PARSE_METHODS.has(String(prop))) {
        const method = Reflect.get(target, prop, receiver)
        if (typeof method !== 'function') {
          return method
        }
        return (...args: unknown[]) => {
          beforeParse()
          return method.apply(target, args)
        }
      }
      const next = Reflect.get(target, prop, receiver)
      if (typeof next === 'function') {
        return (...args: unknown[]) => wrapParseMethods(
          (next as (...a: unknown[]) => unknown).apply(target, args),
          beforeParse,
        )
      }
      return wrapParseMethods(next, beforeParse)
    },
  })
}

function wrapCallable(
  fn: (...args: unknown[]) => unknown,
  beforeParse: () => void,
  bindTarget: unknown,
): (...args: unknown[]) => unknown {
  return (...args: unknown[]) => wrapParseMethods(
    fn.apply(bindTarget, args),
    beforeParse,
  )
}

export type PublicZodNamespaceOptions = {
  /** Runs before every parse* on schemas obtained through this namespace. */
  beforeParse: () => void
}

/**
 * Public Zod namespace without `config` (issue #38). Empty proxy target hides non-configurable `config`;
 * parse guards handle concurrency.
 */
export function createPublicZodNamespace<T extends object>(
  zodNamespace: T,
  options: PublicZodNamespaceOptions,
): Omit<T, 'config'> {
  const { beforeParse } = options
  return new Proxy({} as Omit<T, 'config'>, {
    get(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(zodNamespace, prop)
      if (descriptor && !descriptor.configurable) {
        return Reflect.get(zodNamespace, prop, zodNamespace)
      }
      const value = Reflect.get(zodNamespace, prop, zodNamespace)
      if (typeof value === 'function') {
        return wrapCallable(value as (...args: unknown[]) => unknown, beforeParse, zodNamespace)
      }
      return wrapParseMethods(value, beforeParse)
    },
    has(_target, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(zodNamespace, prop)
    },
    ownKeys() {
      return Reflect.ownKeys(zodNamespace).filter(key => key !== 'config')
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      try {
        return descriptorForEmptyProxyTarget(
          Reflect.getOwnPropertyDescriptor(zodNamespace, prop),
        )
      }
      catch {
        return undefined
      }
    },
  })
}
