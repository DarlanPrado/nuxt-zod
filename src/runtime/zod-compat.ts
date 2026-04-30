import type * as z3 from 'zod/v3'
import type * as z4 from 'zod/v4/core'

export type AnyZodIssue = z3.ZodIssue | z4.$ZodIssue

type LooseIssue = Record<string, unknown>

export interface NormalizedZodIssue {
  code?: string
  expected?: string
  type?: string
  rule?: string
  format?: string
  isZod4Like: boolean
}

export function asIssueRecord(value: unknown): LooseIssue | undefined {
  return value && typeof value === 'object' ? value as LooseIssue : undefined
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function normalizeZodIssue(issueInput: unknown): NormalizedZodIssue {
  const issue = asIssueRecord(issueInput) || {}
  const code = asString(issue.code)
  const expected = asString(issue.expected)
  const issueType = asString(issue.type)
  const issueOrigin = asString(issue.origin)
  const format = asString(issue.format)
  const validation = asString(issue.validation)

  const type = code === 'invalid_type'
    ? expected
    : code === 'invalid_date'
      ? 'date'
      : (code === 'invalid_string' || code === 'invalid_format')
          ? 'string'
          : issueType ?? issueOrigin

  const rule = code === 'too_small'
    ? 'min'
    : code === 'too_big'
      ? 'max'
      : validation ?? format ?? code

  return {
    code,
    expected,
    type,
    rule,
    format,
    isZod4Like: '_zod' in issue,
  }
}

export function resolveIsoRule(issue: NormalizedZodIssue): string | undefined {
  const candidates = [issue.format, issue.rule]
  for (const candidate of candidates) {
    if (candidate && ['date', 'datetime', 'time', 'duration'].includes(candidate)) {
      return candidate
    }
  }
  return undefined
}
