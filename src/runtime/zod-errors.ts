import { z } from 'zod'
import { asIssueRecord, normalizeZodIssue, resolveIsoRule } from './zod-compat'

type ZodRuleMessages = {
  default?: string
  [ruleName: string]: string | undefined
}

type ZodTypeMessageConfig = string | ZodRuleMessages

export interface ZodErrorMessages {
  iso?: ZodRuleMessages
  string?: ZodTypeMessageConfig
  number?: ZodTypeMessageConfig
  boolean?: ZodTypeMessageConfig
  date?: ZodTypeMessageConfig
  array?: ZodTypeMessageConfig
  object?: ZodTypeMessageConfig
  bigint?: ZodTypeMessageConfig
  null?: ZodTypeMessageConfig
  undefined?: ZodTypeMessageConfig
  [issueCode: string]: string | ZodRuleMessages | ZodTypeMessageConfig | undefined
}

interface ZodConfigOptions {
  customError?: (issue: Record<string, unknown>) => string | undefined
}

type ZodWithConfig = typeof z & {
  config?: (options: ZodConfigOptions) => void
}

let appliedSignature: string | undefined

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function resolveTypeMessage(
  typeConfig: ZodTypeMessageConfig | undefined,
  rule: string | undefined,
  code: string | undefined,
): string | undefined {
  if (!typeConfig) {
    return undefined
  }
  if (typeof typeConfig === 'string') {
    return typeConfig
  }
  if (rule && asString(typeConfig[rule])) {
    return asString(typeConfig[rule])
  }
  if (code && asString(typeConfig[code])) {
    return asString(typeConfig[code])
  }
  return asString(typeConfig.default)
}

export function applyGlobalZodErrorMessages(messages?: ZodErrorMessages) {
  if (!messages) {
    return
  }

  const signature = JSON.stringify(messages)
  if (appliedSignature === signature) {
    return
  }

  const customError = (issueInput: Record<string, unknown>) => {
    const normalized = normalizeZodIssue(issueInput)
    const code = normalized.code
    const rule = normalized.rule
    const type = normalized.type
    const isoRule = resolveIsoRule(normalized)

    if (isoRule) {
      const isoNode = asIssueRecord(messages.iso)
      const isoMessage = isoNode && asString(isoNode[isoRule])
      if (isoMessage) {
        return isoMessage
      }
    }

    if (type) {
      const typeMessage = resolveTypeMessage(messages[type] as ZodTypeMessageConfig | undefined, rule, code)
      if (typeMessage) {
        return typeMessage
      }
    }

    if (code && asString(messages[code])) {
      return asString(messages[code])
    }
    return asString(messages.default)
  }

  const zodWithConfig = z as ZodWithConfig
  // Keep runtime mutation on the public `zod` root export so direct user imports
  // (`import { z } from 'zod'`) observe the same global error behavior.
  if (typeof zodWithConfig.config === 'function') {
    zodWithConfig.config({ customError })
  }
  else {
    const setErrorMap = (z as unknown as {
      setErrorMap?: (fn: (...args: unknown[]) => { message: string }) => void
    }).setErrorMap
    if (typeof setErrorMap === 'function') {
      setErrorMap((issue: unknown, ctx: unknown) => {
        const ctxRecord = asIssueRecord(ctx)
        const fallback = asString(ctxRecord?.defaultError) ?? 'Invalid input'
        return {
          message: customError(asIssueRecord(issue) || {}) ?? fallback,
        }
      })
    }
  }

  appliedSignature = signature
}
