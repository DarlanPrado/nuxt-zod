import { z } from 'zod/v4'
import * as mini from 'zod/mini'
import { z as v3 } from 'zod/v3'
import { createPublicZodNamespace, omitZodConfigMethod } from '../src/runtime/zod-config'
import type { ZodConfigInput } from '../src/runtime/zod-config'
import { createAppZodAccessProxy } from '../src/runtime/app-zod-runtime'
import { useZod as useServerZod } from '../src/runtime/v4/server/utils/useZod'
import { z as serverZod } from '../src/runtime/mini/server/public-z'

const config: ZodConfigInput = {
  customError: issue => issue.code === 'invalid_type' ? issue.path?.join('.') : undefined,
  localeError: issue => issue.code === 'invalid_type' ? issue.path?.join('.') : undefined,
}
void config

const namespaces = [
  createPublicZodNamespace(z),
  omitZodConfigMethod(mini),
  createPublicZodNamespace(v3),
  createAppZodAccessProxy<typeof z>({}),
  useServerZod(),
  serverZod,
] as const

type PublicNamespaces<T extends readonly object[]> = {
  [K in keyof T]: 'config' extends keyof T[K] ? never : T[K]
}
const publicNamespaces: PublicNamespaces<typeof namespaces> = namespaces
for (const namespace of publicNamespaces) {
  namespace.string()
  // @ts-expect-error config is absent from every public namespace
  namespace.config({})
}
