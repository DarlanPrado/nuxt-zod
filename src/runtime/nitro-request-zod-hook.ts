import type { H3Event } from 'h3'
import { getNitroZodModuleErrorMessages, registerNitroZodEffectiveBaseline } from './zod-context-config'
import { prepareNitroZodConfig } from './zod-config'
import { getZodRequestSwapState } from './zod-request-swap-state'

function resolveRequestPath(event: H3Event): string {
  return event.path || event.node?.req?.url?.split('?')[0] || ''
}

export function applyNitroRequestZodState<TMessages extends Record<string, unknown>>(
  event: H3Event,
  zodNamespace: unknown,
  runtimeErrorMessages: TMessages | undefined,
  applyGlobalZodErrorMessages: (messages?: TMessages, options?: { force?: boolean }) => void,
): void {
  const errors = (runtimeErrorMessages ?? getNitroZodModuleErrorMessages()) as TMessages | undefined
  if (errors) {
    getZodRequestSwapState(event.context).nitroErrorMessages = errors
  }

  const path = resolveRequestPath(event)
  if (!path.startsWith('/api')) {
    return
  }

  applyGlobalZodErrorMessages(errors, { force: true })
  registerNitroZodEffectiveBaseline(zodNamespace)
  prepareNitroZodConfig(zodNamespace, undefined, event.context)
}
