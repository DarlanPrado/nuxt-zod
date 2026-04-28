import { createError, getQuery, getRouterParams, readBody } from 'h3'
import type { H3Event } from 'h3'
import type { z } from 'zod'
import { useRuntimeConfig } from 'nitropack/runtime'

export interface ValidationSchema {
  body?: z.ZodTypeAny
  query?: z.ZodTypeAny
  params?: z.ZodTypeAny
}

type RequireAtLeastOne<T, Keys extends keyof T = keyof T>
  = Keys extends keyof T
    ? Required<Pick<T, Keys>> & Partial<Omit<T, Keys>>
    : never

export type ValidationSchemaInput = RequireAtLeastOne<ValidationSchema>

export interface ValidationOptions {
  statusCode?: number
  message?: string
  includeIssues?: boolean
}

export type InferValidated<T extends ValidationSchema> = {
  [K in keyof T]: T[K] extends z.ZodTypeAny ? z.infer<T[K]> : never
}

export interface NuxtZodRuntimeValidation {
  statusCode: number
  message: string
  includeIssues: boolean
}

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
    body?: z.ZodIssue[]
    query?: z.ZodIssue[]
    params?: z.ZodIssue[]
  } | undefined

  if (schema.body) {
    const body = await readBody(event)
    const result = await schema.body.safeParseAsync(body)
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
    const result = await schema.query.safeParseAsync(query)
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
    const result = await schema.params.safeParseAsync(params)
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

declare module 'h3' {
  interface H3Event {
    validate: <T extends ValidationSchemaInput>(
      schema: T,
      options?: ValidationOptions,
    ) => Promise<InferValidated<T>>
  }
}
