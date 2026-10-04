import { createLazyPublicZExport } from '../../proxy-descriptor'
import { getNuxtZodServerNamespace } from './zod-provider'

type ZodNamespace = typeof import('zod/v3').z

export const z: Omit<ZodNamespace, 'config'> = createLazyPublicZExport<ZodNamespace>(
  () => getNuxtZodServerNamespace(),
)
