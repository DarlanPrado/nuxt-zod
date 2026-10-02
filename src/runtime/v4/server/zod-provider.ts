import { z } from 'zod/v4'
import {
  applyZodConfigToNamespace,
  createPublicZodNamespace,
  getInjectedZodConfig,
} from '../../zod-config'

let publicZod: Omit<typeof z, 'config'> | undefined

export function getNuxtZodServerNamespace(): Omit<typeof z, 'config'> {
  // SSR app plugins can update the same Zod runtime between Nitro calls.
  applyZodConfigToNamespace(z, getInjectedZodConfig())
  publicZod ||= createPublicZodNamespace(z)
  return publicZod
}
