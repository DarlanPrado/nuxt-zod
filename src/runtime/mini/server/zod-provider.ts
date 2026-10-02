import * as z from 'zod/mini'
import {
  applyZodConfigToNamespace,
  getInjectedZodConfig,
  omitZodConfigMethod,
} from '../../zod-config'

let publicZod: typeof z | undefined

export function getNuxtZodServerNamespace(): typeof z {
  if (!publicZod) {
    applyZodConfigToNamespace(z, getInjectedZodConfig())
    publicZod = omitZodConfigMethod(z)
  }
  return publicZod
}
