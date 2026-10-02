import { createPublicZodNamespace } from '../../zod-config'
import { getNuxtZodServerNamespace } from './zod-provider'

type ZodNamespace = typeof import('zod/v4').z

export const z: Omit<ZodNamespace, 'config'> = createPublicZodNamespace(
  getNuxtZodServerNamespace(),
  getNuxtZodServerNamespace,
)
