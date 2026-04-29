import { z } from 'zod'

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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function resolveIssueType(issue: Record<string, unknown>): string | undefined {
  const code = asString(issue.code)
  const expected = asString(issue.expected)
  const issueType = asString(issue.type)

  if (code === 'invalid_type' && expected) {
    return expected
  }
  if (code === 'invalid_date') {
    return 'date'
  }
  if (code === 'invalid_string' || code === 'invalid_format') {
    return 'string'
  }
  if (issueType) {
    return issueType
  }
  return undefined
}

function resolveIssueRule(issue: Record<string, unknown>): string | undefined {
  const code = asString(issue.code)
  if (code === 'too_small') {
    return 'min'
  }
  if (code === 'too_big') {
    return 'max'
  }
  return asString(issue.validation) ?? asString(issue.format) ?? code
}

function resolveIsoRule(issue: Record<string, unknown>): string | undefined {
  const format = asString(issue.format)
  if (format && ['date', 'datetime', 'time', 'duration'].includes(format)) {
    return format
  }
  const validation = asString(issue.validation)
  if (validation && ['date', 'datetime', 'time', 'duration'].includes(validation)) {
    return validation
  }
  return undefined
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
    const issue = asRecord(issueInput) || {}
    const code = asString(issue.code)
    const rule = resolveIssueRule(issue)
    const type = resolveIssueType(issue)
    const isoRule = resolveIsoRule(issue)

    if (isoRule) {
      const isoNode = asRecord(messages.iso)
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
  if (typeof zodWithConfig.config === 'function') {
    zodWithConfig.config({ customError })
  }
  else if (typeof z.setErrorMap === 'function') {
    z.setErrorMap((issue, ctx) => ({
      message: customError(asRecord(issue as unknown) || {}) ?? ctx.defaultError,
    }))
  }

  appliedSignature = signature
}
