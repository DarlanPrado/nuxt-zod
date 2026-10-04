import { z } from '../zod-nitro'
import { createPublicZodNamespace } from '../../zod-config'
import { getNitroConfigGeneration } from '../../nitro-zod-config'
import { runNitroZodBeforeParse, updateNitroZodParseGuard } from '../../nitro-zod-parse-guard'

let publicZod: Omit<typeof z, 'config'> | undefined
let appliedGeneration = -1

export function getNuxtZodServerNamespace(): Omit<typeof z, 'config'> {
  const generation = getNitroConfigGeneration()
  if (generation !== appliedGeneration) {
    publicZod = undefined
    appliedGeneration = generation
  }
  updateNitroZodParseGuard(z)
  runNitroZodBeforeParse()
  publicZod ??= createPublicZodNamespace(z, { beforeParse: runNitroZodBeforeParse })
  return publicZod
}

export function createNitroZodAccessProxy(): Omit<typeof z, 'config'> {
  return new Proxy({} as Omit<typeof z, 'config'>, {
    get(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      const namespace = getNuxtZodServerNamespace()
      return Reflect.get(namespace, prop, namespace)
    },
    has(_target, prop) {
      if (prop === 'config') {
        return false
      }
      return Reflect.has(getNuxtZodServerNamespace(), prop)
    },
    ownKeys() {
      return Reflect.ownKeys(getNuxtZodServerNamespace())
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (prop === 'config') {
        return undefined
      }
      return Reflect.getOwnPropertyDescriptor(getNuxtZodServerNamespace(), prop)
    },
  })
}
