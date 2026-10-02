import { z } from '../zod-nitro'
import { createPublicZodNamespace, prepareNitroZodConfig } from '../../zod-config'
import { getInjectedZodConfig } from '../../nitro-zod-config'

let publicZod: Omit<typeof z, 'config'> | undefined

export function getNuxtZodServerNamespace(): Omit<typeof z, 'config'> {
  prepareNitroZodConfig(z, getInjectedZodConfig())
  publicZod ??= createPublicZodNamespace(z)
  return publicZod
}
