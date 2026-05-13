import type { z } from 'zod/v3'

/** Zod 3 schemas only (`zodVersion: 'v3'`). */
export type AnyZodSchemaPublic = z.ZodTypeAny

export interface ValidationSchema {
  body?: AnyZodSchemaPublic
  query?: AnyZodSchemaPublic
  params?: AnyZodSchemaPublic
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

type InferOne<S> = S extends z.ZodTypeAny ? z.infer<S> : never

export type InferValidated<T extends ValidationSchema> = {
  [K in keyof T]: T[K] extends AnyZodSchemaPublic ? InferOne<T[K]> : never
}

export interface NuxtZodRuntimeValidation {
  statusCode: number
  message: string
  includeIssues: boolean
}
