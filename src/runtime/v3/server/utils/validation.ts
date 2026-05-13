import { createError, getQuery, getRouterParams, readBody } from 'h3'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { safeParseAsync, type AnyZodSchema } from '../../zod-adapter'
import type {
  InferValidated,
  NuxtZodRuntimeValidation,
  ValidationOptions,
  ValidationSchemaInput,
} from '../../validation-types'

export type {
  InferValidated,
  NuxtZodRuntimeValidation,
  ValidationOptions,
  ValidationSchemaInput,
} from '../../validation-types'

const VALIDATION_DEFAULTS_CACHE_KEY = '__nuxt_zod_validation_defaults'

function getCachedGlobalValidationOptions(event: H3Event): NuxtZodRuntimeValidation {
  const context = event.context as Record<string, unknown>
  const cached = context[VALIDATION_DEFAULTS_CACHE_KEY] as NuxtZodRuntimeValidation | undefined
  if (cached) {
    return cached
  }

  const rc = useRuntimeConfig(event) as {
    nuxtZod?: { validation?: ValidationOptions }
  }
  const global = rc.nuxtZod?.validation
  const resolved: NuxtZodRuntimeValidation = {
    statusCode: global?.statusCode ?? 422,
    message: global?.message ?? 'Validation failed',
    includeIssues: global?.includeIssues !== false,
  }
  context[VALIDATION_DEFAULTS_CACHE_KEY] = resolved
  return resolved
}

export function resolveValidationOptions(
  event: H3Event,
  override?: ValidationOptions,
): NuxtZodRuntimeValidation {
  const global = getCachedGlobalValidationOptions(event)
  if (!override) {
    return global
  }

  return {
    statusCode: override.statusCode ?? global.statusCode,
    message: override.message ?? global.message,
    includeIssues: override.includeIssues ?? global.includeIssues,
  }
}

/**
 * Validates `body`, `query` and `params` from the event when the corresponding schema is set.
 * On any failure, throws an H3 error (default 422) with optional Zod issues in `data`.
 */
export async function runEventValidation<T extends ValidationSchemaInput>(
  event: H3Event,
  schema: T,
  options?: ValidationOptions,
): Promise<InferValidated<T>> {
  if (!schema.body && !schema.query && !schema.params) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Validation schema cannot be empty',
    })
  }

  const opts = resolveValidationOptions(event, options)
  const out: Record<string, unknown> = {}
  let issues: {
    body?: unknown[]
    query?: unknown[]
    params?: unknown[]
  } | undefined

  if (schema.body) {
    const body = await readBody(event)
    const result = await safeParseAsync(schema.body as AnyZodSchema, body)
    if (!result.success) {
      issues ||= {}
      issues.body = result.error.issues
    }
    else {
      out.body = result.data
    }
  }

  if (schema.query) {
    const query = getQuery(event)
    const result = await safeParseAsync(schema.query as AnyZodSchema, query)
    if (!result.success) {
      issues ||= {}
      issues.query = result.error.issues
    }
    else {
      out.query = result.data
    }
  }

  if (schema.params) {
    const params = getRouterParams(event)
    const result = await safeParseAsync(schema.params as AnyZodSchema, params)
    if (!result.success) {
      issues ||= {}
      issues.params = result.error.issues
    }
    else {
      out.params = result.data
    }
  }

  if (issues) {
    const data = opts.includeIssues
      ? { validation: true as const, issues }
      : { validation: true as const }
    throw createError({
      statusCode: opts.statusCode,
      statusMessage: opts.message,
      data,
    })
  }

  return out as InferValidated<T>
}
