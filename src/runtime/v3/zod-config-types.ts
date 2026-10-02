import type { ZodIssue } from 'zod/v3'

/**
 * Zod 3: only `customError` is applied via `setErrorMap`; `localeError` / `jitless` are ignored at runtime.
 */
export type ZodConfigInput = {
  customError?: (issue: ZodIssue) => string | undefined
}
