/** Empty proxy targets cannot mirror non-configurable descriptors from the real namespace. */
export function descriptorForEmptyProxyTarget(
  desc: PropertyDescriptor | undefined,
): PropertyDescriptor | undefined {
  if (!desc) {
    return undefined
  }
  return {
    ...desc,
    configurable: true,
  }
}

/**
 * Forwards configurable keys to a prepared public namespace while preserving
 * non-configurable invariants on the real Zod target (`$brand`, `_zod`, …).
 */
export function createForwardingZodProxy<T extends object>(
  target: T,
  resolvePublicNamespace: () => Omit<T, 'config'>,
): Omit<T, 'config'> {
  return new Proxy(target, {
    get(targetObject, prop, receiver) {
      if (prop === 'config') {
        return undefined
      }
      const descriptor = Reflect.getOwnPropertyDescriptor(targetObject, prop)
      if (descriptor && !descriptor.configurable) {
        return Reflect.get(targetObject, prop, receiver)
      }
      const namespace = resolvePublicNamespace()
      return Reflect.get(namespace as object, prop, namespace as object)
    },
    has(targetObject, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(targetObject, prop)
    },
    ownKeys(targetObject) {
      return Reflect.ownKeys(targetObject).filter(key => key !== 'config')
    },
    getOwnPropertyDescriptor(targetObject, prop) {
      if (prop === 'config') {
        return undefined
      }
      try {
        return Reflect.getOwnPropertyDescriptor(targetObject, prop)
      }
      catch {
        return undefined
      }
    },
  })
}
