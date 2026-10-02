import * as z from 'zod/mini'
import {
  applyZodConfigToNamespace,
  createPublicZodNamespace,
  getInjectedZodConfig,
  getNitroConfigGeneration,
} from '../../zod-config'

let publicZod: Omit<typeof z, 'config'> | undefined
let generationApplied = -1

export function getNuxtZodServerNamespace(): Omit<typeof z, 'config'> {
  const generation = getNitroConfigGeneration()
  if (!publicZod || generationApplied !== generation) {
    applyZodConfigToNamespace(z, getInjectedZodConfig())
    publicZod = createPublicZodNamespace(z)
    generationApplied = generation
  }
  return publicZod
}
